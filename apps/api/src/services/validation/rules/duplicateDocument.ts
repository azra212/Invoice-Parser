import { issue, type ValidationRule } from "../types";

export const duplicateDocumentRule: ValidationRule = {
  id: "duplicateDocument",
  async validate(document, context) {
    if (!document.supplierName || !document.documentNumber) return [];
    if (!context.findDuplicate) return [];

    const duplicate = await context.findDuplicate({
      supplierName: document.supplierName,
      documentNumber: document.documentNumber,
      currentDocumentId: context.currentDocumentId,
    });

    if (!duplicate) return [];

    return [
      issue(
        "documentNumber",
        `Duplicate document detected: ${document.supplierName} already has ${document.documentNumber}.`,
        "error",
        "duplicate.document",
      ),
    ];
  },
};
