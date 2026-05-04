// This file defines data structures related to documents, including the extracted data format,
// validation issues, and the final processed document structure.

interface LineItem {
  description: string | null;
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

interface OriginalFile {
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
}

interface ProcessedDocument extends ExtractedData {
  id: string;
  _id?: string;

  status: "uploaded" | "needs_review" | "validated" | "rejected";
  validationIssues: ValidationIssue[];
  createdAt: string;
  fileName: string;
  originalFile?: OriginalFile;
  updatedAt: string;
}

export type {
  LineItem,
  ExtractedData,
  ValidationIssue,
  ProcessedDocument,
  OriginalFile,
};
