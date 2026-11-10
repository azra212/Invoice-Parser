import { describe, expect, it } from "vitest";
import { normalizeExtractedData } from "../../normalizers/documentNormalizer";
import { CsvParser } from "../csvParser";

function parseCsv(content: string) {
  return normalizeExtractedData(CsvParser.extractData(Buffer.from(content)));
}

describe("CsvParser", () => {
  it("extracts simple CSV rows as line items without inventing document metadata", () => {
    const result = parseCsv(`desc,qty,price,total
Item A,1,78,78
Item B,2,84,168
`);

    expect(result.documentType).toBeNull();
    expect(result.supplierName).toBeNull();
    expect(result.documentNumber).toBeNull();
    expect(result.issueDate).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(result.currency).toBeNull();
    expect(result.subtotal).toBeNull();
    expect(result.tax).toBeNull();
    expect(result.total).toBeNull();

    expect(result.lineItems).toEqual([
      { description: "Item A", quantity: 1, unitPrice: 78, amount: 78 },
      { description: "Item B", quantity: 2, unitPrice: 84, amount: 168 },
    ]);
  });

  it("supports common line-item header names", () => {
    const result = parseCsv(`Description,Quantity,Unit Price,Amount
Hosting,2,"99,99","199,98"
`);

    expect(result.lineItems[0]).toEqual({
      description: "Hosting",
      quantity: 2,
      unitPrice: 99.99,
      amount: 199.98,
    });
  });
});

it("extracts multiple invoice-style CSV line items", () => {
  const result = parseCsv(`Description,Quantity,Unit Price,Amount
Website maintenance - March,12,45.00,540.00
Cloud hosting package,1,120.00,120.00
Email support hours,6,35.00,210.00
Analytics dashboard setup,1,180.00,180.00
Backup monitoring service,2,25.00,50.00
`);

  expect(result.documentType).toBeNull();
  expect(result.supplierName).toBeNull();
  expect(result.documentNumber).toBeNull();
  expect(result.issueDate).toBeNull();
  expect(result.dueDate).toBeNull();
  expect(result.currency).toBeNull();
  expect(result.subtotal).toBeNull();
  expect(result.tax).toBeNull();
  expect(result.total).toBeNull();

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
