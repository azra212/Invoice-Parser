import { describe, expect, it } from "vitest";
import { DocumentValidator } from "./documentValidator";
import { ExtractedData } from "../../models/documentTypes";

const validDocument = (): ExtractedData => ({
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
});

describe("DocumentValidator", () => {
  it("returns no issues for a valid document", () => {
    const issues = DocumentValidator.validate(validDocument());

    expect(issues).toHaveLength(0);
  });

  it("flags missing required fields", () => {
    const doc = validDocument();

    doc.documentType = null;
    doc.supplierName = null;
    doc.documentNumber = null;
    doc.issueDate = null;
    doc.dueDate = null;
    doc.currency = null;
    doc.total = null;

    const issues = DocumentValidator.validate(doc);

    expect(issues.some((i) => i.field === "documentType")).toBe(true);
    expect(issues.some((i) => i.field === "supplierName")).toBe(true);
    expect(issues.some((i) => i.field === "documentNumber")).toBe(true);
    expect(issues.some((i) => i.field === "issueDate")).toBe(true);
    expect(issues.some((i) => i.field === "dueDate")).toBe(true);
    expect(issues.some((i) => i.field === "currency")).toBe(true);
    expect(issues.some((i) => i.field === "total")).toBe(true);
  });

  it("flags subtotal mismatch", () => {
    const doc = validDocument();
    doc.subtotal = 80;

    const issues = DocumentValidator.validate(doc);

    expect(
      issues.some((i) => i.field === "subtotal" && i.severity === "error"),
    ).toBe(true);
  });

  it("flags total mismatch", () => {
    const doc = validDocument();
    doc.total = 999;

    const issues = DocumentValidator.validate(doc);

    expect(
      issues.some((i) => i.field === "total" && i.severity === "error"),
    ).toBe(true);
  });

  it("flags due date before issue date", () => {
    const doc = validDocument();
    doc.issueDate = "2025-01-10";
    doc.dueDate = "2025-01-01";

    const issues = DocumentValidator.validate(doc);

    expect(
      issues.some(
        (i) =>
          i.field === "dueDate" &&
          i.message === "Due date cannot be before issue date.",
      ),
    ).toBe(true);
  });

  it("flags line item amount mismatch", () => {
    const doc = validDocument();
    doc.lineItems[0].amount = 90;

    const issues = DocumentValidator.validate(doc);

    expect(issues.some((i) => i.field === "lineItems[0].amount")).toBe(true);
  });
});
