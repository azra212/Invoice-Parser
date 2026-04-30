// This is the BLL. It is responsible for turning a raw file into a structured document object that can be stored in the database.

import {
  ExtractedData,
  ProcessedDocument,
  ValidationIssue,
} from "../models/documentTypes";
import { GeminiParser } from "./parsers/geminiParser";
import { DocumentValidator } from "./validators/documentValidator";
import { Document } from "../models/Document";
import { normalizeExtractedData } from "./normalizers/documentNormalizer";
import { DuplicateValidator } from "./validators/duplicateValidator";

export class DocumentProcessor {
  static async process(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<ProcessedDocument> {
    // 1. Extraction (Using established Gemini Parser)
    const rawExtractedData = await GeminiParser.extractData(
      fileBuffer,
      mimeType,
      fileName,
    );
    const extractedData = normalizeExtractedData(rawExtractedData);
    // 2. Validation
    const validationIssues = [
      ...DocumentValidator.validate(extractedData),
      ...(await DuplicateValidator.validateDocumentNumber(
        extractedData.documentNumber,
      )),
    ];

    // 3. Status logic
    const status = validationIssues.some((i) => i.severity === "error")
      ? "needs_review"
      : "uploaded";

    const savedDocument = (await Document.create({
      fileName,
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
      validationIssues,
      status,
    })) as unknown as ProcessedDocument;

    return savedDocument;
  }
}
