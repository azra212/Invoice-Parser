import { describe, expect, it } from "vitest";
import { normalizeExtractedData } from "../../normalizers/documentNormalizer";
import { TxtParser } from "../txtParser";

function parseTxt(content: string) {
  return normalizeExtractedData(TxtParser.extractData(Buffer.from(content)));
}

describe("TxtParser", () => {
  it("extracts document type, document number, total, and currency from simple TXT invoices", () => {
    const result = parseTxt(`Invoice TXT-0
Total: 758 EUR`);

    expect(result).toMatchObject({
      documentType: "invoice",
      documentNumber: "TXT-0",
      total: 758,
      currency: "EUR",
    });

    expect(result.supplierName).toBeNull();
    expect(result.issueDate).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(result.lineItems).toEqual([]);
  });

  it("extracts BAM currency from total line", () => {
    const result = parseTxt(`Invoice TXT-2
Total: 999 BAM`);

    expect(result).toMatchObject({
      documentType: "invoice",
      documentNumber: "TXT-2",
      total: 999,
      currency: "BAM",
    });
  });

  it("extracts a simple pipe-delimited line-item table", () => {
    const result = parseTxt(`Invoice TXT-3
Total: 125 EUR

Description | Qty | Unit Price | Amount
Hosting | 2 | 50 | 100
Support | 1 | 25 | 25
`);

    expect(result.lineItems).toEqual([
      { description: "Hosting", quantity: 2, unitPrice: 50, amount: 100 },
      { description: "Support", quantity: 1, unitPrice: 25, amount: 25 },
    ]);
  });
});

it("extracts a complex invoice-style TXT file with line items", () => {
  const result = parseTxt(`Invoice TXT-1047

Supplier: Northstar Digital Services Ltd.
Invoice Number: TXT-1047
Issue Date: 2025-03-14
Due Date: 2025-04-13
Currency: EUR

Bill To:
Acme Operations GmbH
Main Street 18
10115 Berlin
Germany

Description | Qty | Unit Price | Amount
Website maintenance - March | 12 | 45.00 | 540.00
Cloud hosting package | 1 | 120.00 | 120.00
Email support hours | 6 | 35.00 | 210.00
Analytics dashboard setup | 1 | 180.00 | 180.00
Backup monitoring service | 2 | 25.00 | 50.00

Subtotal: 1100.00
Tax: 220.00
Total: 1320.00 EUR

Payment Terms: Net 30
Bank Reference: TXT-1047
Thank you for your business.
`);

  expect(result).toMatchObject({
    documentType: "invoice",
    supplierName: "Northstar Digital Services Ltd.",
    documentNumber: "TXT-1047",
    issueDate: "2025-03-14",
    dueDate: "2025-04-13",
    currency: "EUR",
    subtotal: 1100,
    tax: 220,
    total: 1320,
  });

  expect(result.lineItems).toEqual([
    {
      description: "Website maintenance - March",
      quantity: 12,
      unitPrice: 45,
      amount: 540,
    },
    {
      description: "Cloud hosting package",
      quantity: 1,
      unitPrice: 120,
      amount: 120,
    },
    {
      description: "Email support hours",
      quantity: 6,
      unitPrice: 35,
      amount: 210,
    },
    {
      description: "Analytics dashboard setup",
      quantity: 1,
      unitPrice: 180,
      amount: 180,
    },
    {
      description: "Backup monitoring service",
      quantity: 2,
      unitPrice: 25,
      amount: 50,
    },
  ]);
});
