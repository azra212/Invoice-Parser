import { describe, expect, it } from "vitest";
import { normalizeExtractedData } from "./documentNormalizer";

describe("normalizeExtractedData", () => {
  it("converts string null values to actual null", () => {
    const result = normalizeExtractedData({
      documentType: "null",
      supplierName: "null",
      documentNumber: "undefined",
      issueDate: "N/A",
      dueDate: "unknown",
      currency: "none",
      lineItems: [],
      subtotal: "null",
      tax: "undefined",
      total: "",
    });

    expect(result.documentType).toBeNull();
    expect(result.supplierName).toBeNull();
    expect(result.documentNumber).toBeNull();
    expect(result.issueDate).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(result.currency).toBeNull();
    expect(result.subtotal).toBeNull();
    expect(result.tax).toBeNull();
    expect(result.total).toBeNull();
  });

  it("normalizes numeric strings into numbers", () => {
    const result = normalizeExtractedData({
      documentType: "invoice",
      supplierName: "Acme Ltd",
      documentNumber: "INV-001",
      issueDate: "2025-01-01",
      dueDate: "2025-01-10",
      currency: "usd",
      lineItems: [
        {
          description: "Hosting",
          quantity: "2",
          unitPrice: "$50.00",
          amount: "100.00",
        },
      ],
      subtotal: "$100.00",
      tax: "$20.00",
      total: "$120.00",
    });

    expect(result.currency).toBe("USD");
    expect(result.subtotal).toBe(100);
    expect(result.tax).toBe(20);
    expect(result.total).toBe(120);
    expect(result.lineItems[0].quantity).toBe(2);
    expect(result.lineItems[0].unitPrice).toBe(50);
    expect(result.lineItems[0].amount).toBe(100);
  });

  it("does not replace missing line item description with fake text", () => {
    const result = normalizeExtractedData({
      documentType: "invoice",
      supplierName: "Acme Ltd",
      documentNumber: "INV-001",
      issueDate: "2025-01-01",
      dueDate: "2025-01-10",
      currency: "USD",
      lineItems: [
        {
          description: null,
          quantity: 1,
          unitPrice: 10,
          amount: 10,
        },
      ],
      subtotal: 10,
      tax: 0,
      total: 10,
    });

    expect(result.lineItems[0].description).toBeNull();
  });

  it("handles European decimal comma format", () => {
    const result = normalizeExtractedData({
      documentType: "invoice",
      supplierName: "Société Exemple",
      documentNumber: "FAC-001",
      issueDate: "2025-01-01",
      dueDate: "2025-01-10",
      currency: "eur",
      lineItems: [
        {
          description: "Service",
          quantity: "1",
          unitPrice: "99,99",
          amount: "99,99",
        },
      ],
      subtotal: "99,99",
      tax: "20,00",
      total: "119,99",
    });

    expect(result.subtotal).toBe(99.99);
    expect(result.tax).toBe(20);
    expect(result.total).toBe(119.99);
    expect(result.lineItems[0].unitPrice).toBe(99.99);
    expect(result.lineItems[0].amount).toBe(99.99);
  });
});
