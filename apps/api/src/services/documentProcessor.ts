import { AppError } from "../errors/AppError";
import { Document } from "../models/Document";
import { extractDocument } from "./extraction/extractDocument";
import { getStorage } from "./runtime";
import { mongoDuplicateLookup } from "./validation/duplicateLookup";
import { statusForIssues, validateDocument } from "./validation/engine";

export function canRunAttempt(
  document: { status?: string | null; processingAttempt?: number | null },
  attempt: number,
): boolean {
  return (
    document.processingAttempt === attempt &&
    (document.status === "uploaded" || document.status === "processing")
  );
}

function failureMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return "Document processing failed. Please try again.";
}

export async function processStoredDocument(
  documentId: string,
  attempt: number,
): Promise<void> {
  const existing = await Document.findById(documentId);
  if (!existing || !canRunAttempt(existing, attempt)) return;

  existing.status = "processing";
  await existing.save();

  try {
    const key =
      existing.originalFile?.storageKey || existing.originalFile?.path;
    if (!key) {
      throw new Error("Original file is missing.");
    }

    const file = await getStorage().read(key);
    if (!file) {
      throw new Error("Original file is missing from storage.");
    }

    const extraction = await extractDocument({
      input: {
        fileBuffer: file.body,
        mimeType: existing.originalFile?.mimeType || file.mimeType,
        fileName:
          existing.fileName ||
          existing.originalFile?.originalName ||
          "document",
      },
    });
    const validationIssues = await validateDocument(extraction.data, {
      findDuplicate: mongoDuplicateLookup(),
      currentDocumentId: documentId,
    });

    const current = await Document.findById(documentId);
    if (!current || current.processingAttempt !== attempt) return;

    current.set({
      documentType: extraction.data.documentType,
      supplierName: extraction.data.supplierName,
      documentNumber: extraction.data.documentNumber,
      issueDate: extraction.data.issueDate,
      dueDate: extraction.data.dueDate,
      currency: extraction.data.currency,
      lineItems: extraction.data.lineItems,
      subtotal: extraction.data.subtotal,
      tax: extraction.data.tax,
      total: extraction.data.total,
      fieldConfidence: extraction.fieldConfidence,
      rawExtraction: extraction.rawExtraction,
      validationIssues,
      status: statusForIssues(validationIssues),
    });
    await current.save();
  } catch (error) {
    const current = await Document.findById(documentId);
    if (!current || current.processingAttempt !== attempt) return;
    current.set({
      status: "failed",
      validationIssues: [
        {
          field: "file",
          message: failureMessage(error),
          severity: "error",
          code: "pipeline.failed",
        },
      ],
    });
    await current.save();
    console.error("Document processing failed:", error);
  }
}
