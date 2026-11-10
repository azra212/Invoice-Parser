import { describe, expect, it } from "vitest";
import {
  extractedDataSchema,
  modelExtractionSchema,
  processedDocumentSchema,
} from "./document";

const invoice = {
  documentType: "invoice",
  supplierName: "Northstar Digital Services Ltd.",
  documentNumber: "TXT-1047",
  issueDate: "2025-03-14",
  dueDate: "2025-04-13",
  currency: "EUR",
  lineItems: [
    {
      description: "Website maintenance - March",
      quantity: 12,
      unitPrice: 45,
      amount: 540,
    },
  ],
  subtotal: 1100,
  tax: 220,
  total: 1320,
};

describe("document schemas", () => {
  it("accepts a normalized invoice", () => {
    expect(extractedDataSchema.parse(invoice).documentNumber).toBe("TXT-1047");
  });

  it("rejects an unknown document type", () => {
    const result = extractedDataSchema.safeParse({
      ...invoice,
      documentType: "receipt",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a stored document with review status", () => {
    const result = processedDocumentSchema.parse({
      ...invoice,
      _id: "doc-1",
      status: "needs_review",
      validationIssues: [
        {
          field: "total",
          message: "Total does not match subtotal plus tax.",
          severity: "error",
        },
      ],
      fileName: "Invoice TXT-1047.txt",
      createdAt: "2026-05-04T15:20:25.538Z",
      updatedAt: "2026-05-04T15:20:52.401Z",
    });

    expect(result.status).toBe("needs_review");
  });

  it("rejects a model confidence above 1", () => {
    const result = modelExtractionSchema.safeParse({
      ...invoice,
      fieldConfidence: [{ field: "total", confidence: 1.4 }],
    });

    expect(result.success).toBe(false);
  });

  it("defaults missing model confidence to an empty list", () => {
    const result = modelExtractionSchema.parse(invoice);

    expect(result.fieldConfidence).toEqual([]);
  });
});
