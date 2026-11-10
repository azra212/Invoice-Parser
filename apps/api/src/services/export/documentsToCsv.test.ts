import { describe, expect, it } from "vitest";
import { documentsToCsv } from "./documentsToCsv";

describe("documentsToCsv", () => {
  it("quotes values that contain commas", () => {
    const csv = documentsToCsv([
      {
        documentNumber: "INV-1",
        supplierName: "Acme, Ltd",
        issueDate: "2025-01-01",
        dueDate: "2025-01-10",
        currency: "EUR",
        subtotal: 10,
        tax: 2,
        total: 12,
        status: "validated",
      },
    ]);

    expect(csv.split("\n")[0]).toBe(
      "documentNumber,supplierName,issueDate,dueDate,currency,subtotal,tax,total,status",
    );
    expect(csv).toContain('"Acme, Ltd"');
    expect(csv).toContain("INV-1");
  });
});
