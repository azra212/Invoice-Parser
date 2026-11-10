import type { ExtractedData } from "@invoice-parser/shared";

export function sampleDocument(
  overrides: Partial<ExtractedData> = {},
): ExtractedData {
  return {
    documentType: "invoice",
    supplierName: "Acme Ltd",
    documentNumber: "INV-001",
    issueDate: "2025-01-01",
    dueDate: "2025-01-10",
    currency: "USD",
    lineItems: [
      {
        description: "Hosting",
        quantity: 2,
        unitPrice: 50,
        amount: 100,
      },
    ],
    subtotal: 100,
    tax: 20,
    total: 120,
    ...overrides,
  };
}
