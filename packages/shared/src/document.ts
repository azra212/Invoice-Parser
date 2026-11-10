import { z } from "zod";

export const documentTypeSchema = z.enum(["invoice", "purchase_order"]);

export const documentStatusSchema = z.enum([
  "uploaded",
  "needs_review",
  "validated",
  "rejected",
]);

export const validationSeveritySchema = z.enum(["error", "warning"]);

export const lineItemSchema = z.object({
  description: z.string().nullable(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  amount: z.number().nullable(),
  _id: z.string().optional(),
});

export const extractedDataSchema = z.object({
  documentType: documentTypeSchema.nullable(),
  supplierName: z.string().nullable(),
  documentNumber: z.string().nullable(),
  issueDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  currency: z.string().nullable(),
  lineItems: z.array(lineItemSchema),
  subtotal: z.number().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
});

export const validationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: validationSeveritySchema,
  code: z.string().min(1),
});

export const originalFileSchema = z.object({
  originalName: z.string(),
  storedName: z.string(),
  path: z.string(),
  mimeType: z.string(),
});

export const fieldConfidenceEntrySchema = z.object({
  field: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const fieldConfidenceSchema = z.record(
  z.string(),
  z.number().min(0).max(1),
);

export const modelExtractionSchema = extractedDataSchema.extend({
  fieldConfidence: z.array(fieldConfidenceEntrySchema).default([]),
});

export const rawExtractionSchema = z.object({
  provider: z.string(),
  model: z.string().nullable(),
  output: z.unknown(),
  receivedAt: z.string(),
});

export const processedDocumentSchema = extractedDataSchema.extend({
  id: z.string().optional(),
  _id: z.string().optional(),
  status: documentStatusSchema,
  validationIssues: z.array(validationIssueSchema),
  fileName: z.string(),
  originalFile: originalFileSchema.optional(),
  fieldConfidence: fieldConfidenceSchema.optional(),
  rawExtraction: rawExtractionSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type ExtractedData = z.infer<typeof extractedDataSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type OriginalFile = z.infer<typeof originalFileSchema>;
export type FieldConfidenceEntry = z.infer<typeof fieldConfidenceEntrySchema>;
export type ModelExtraction = z.infer<typeof modelExtractionSchema>;
export type RawExtraction = z.infer<typeof rawExtractionSchema>;
export type ProcessedDocument = z.infer<typeof processedDocumentSchema>;
