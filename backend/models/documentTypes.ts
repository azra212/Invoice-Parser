// This file defines data structures related to documents, including the extracted data format,
// validation issues, and the final processed document structure.
// It serves as a contract for how document data should be represented throughout the application.

interface LineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
}

interface ExtractedData {
  documentType: "invoice" | "purchase_order" | null;
  supplierName: string | null;
  documentNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  currency: string | null;
  lineItems: LineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
}

interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface ProcessedDocument extends ExtractedData {
  id: string;
  status: "uploaded" | "needs_review" | "validated" | "rejected";
  validationIssues: ValidationIssue[];
  createdAt: string;
  fileName: string;
}

export type { LineItem, ExtractedData, ValidationIssue, ProcessedDocument };
