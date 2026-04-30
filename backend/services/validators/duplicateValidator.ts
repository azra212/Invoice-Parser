import { Document } from "../../models/Document";
import { ValidationIssue } from "../../models/documentTypes";

export class DuplicateValidator {
  static async validateDocumentNumber(
    documentNumber: string | null,
    currentDocumentId?: string,
  ): Promise<ValidationIssue[]> {
    if (!documentNumber) {
      return [];
    }

    const query: any = {
      documentNumber,
    };

    // When editing an existing document, do not count itself as a duplicate
    if (currentDocumentId) {
      query._id = { $ne: currentDocumentId };
    }

    const duplicate =
      await Document.findOne(query).select("_id documentNumber");

    if (!duplicate) {
      return [];
    }

    return [
      {
        field: "documentNumber",
        message: `Duplicate document number detected: ${documentNumber}.`,
        severity: "error",
      },
    ];
  }
}
