import type { ExtractedData, ValidationIssue } from "@invoice-parser/shared";

export type DuplicateMatch = {
  id: string;
};

export type ValidationContext = {
  currentDocumentId?: string;
  findDuplicate?: (input: {
    supplierName: string;
    documentNumber: string;
    currentDocumentId?: string;
  }) => Promise<DuplicateMatch | null>;
};

export type ValidationRule = {
  id: string;
  validate: (
    document: ExtractedData,
    context: ValidationContext,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
};

export function issue(
  field: string,
  message: string,
  severity: ValidationIssue["severity"],
  code: string,
): ValidationIssue {
  return { field, message, severity, code };
}
