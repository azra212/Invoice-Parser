import type { OriginalFile, ProcessedDocument } from "@invoice-parser/shared";
import { Document } from "../models/Document";
import { extractDocument } from "./extraction/extractDocument";
import { DocumentValidator } from "./validators/documentValidator";
import { DuplicateValidator } from "./validators/duplicateValidator";

export class DocumentProcessor {
  static async process(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    originalFile?: OriginalFile,
  ): Promise<ProcessedDocument> {
    const extraction = await extractDocument({
      input: { fileBuffer, mimeType, fileName },
    });
    const extractedData = extraction.data;
    const validationIssues = [
      ...DocumentValidator.validate(extractedData),
      ...(await DuplicateValidator.validateDocumentNumber(
        extractedData.documentNumber,
      )),
    ];

    const status = validationIssues.some((i) => i.severity === "error")
      ? "needs_review"
      : "uploaded";

    const savedDocument = (await Document.create({
      fileName,
      originalFile,

      documentType: extractedData.documentType,
      supplierName: extractedData.supplierName,
      documentNumber: extractedData.documentNumber,
      issueDate: extractedData.issueDate,
      dueDate: extractedData.dueDate,
      currency: extractedData.currency,
      lineItems: extractedData.lineItems,
      subtotal: extractedData.subtotal,
      tax: extractedData.tax,
      total: extractedData.total,
      fieldConfidence: extraction.fieldConfidence,
      rawExtraction: extraction.rawExtraction,
      validationIssues,
      status,
    })) as unknown as ProcessedDocument;

    return savedDocument;
  }
}
