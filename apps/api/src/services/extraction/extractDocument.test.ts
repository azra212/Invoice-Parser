import { describe, expect, it } from "vitest";
import { extractDocument } from "./extractDocument";
import { csvProvider } from "./csvProvider";
import { InvalidExtractionError } from "./errors";
import { txtProvider } from "./txtProvider";
import type { ExtractionProvider } from "./types";

const invoiceFields = {
  documentType: "invoice",
  supplierName: "Northstar Digital Services Ltd.",
  documentNumber: "TXT-1",
  issueDate: "2025-03-14",
  dueDate: "2025-04-13",
  currency: "EUR",
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
  fieldConfidence: [{ field: "total", confidence: 0.4 }],
};

describe("extractDocument", () => {
  it("scores deterministic CSV fields that were actually read", async () => {
    const result = await extractDocument({
      input: {
        fileBuffer: Buffer.from(
          "Description,Quantity,Unit Price,Amount\nHosting,2,10,20\n",
        ),
        mimeType: "text/csv",
        fileName: "items.csv",
      },
      providers: [csvProvider, txtProvider],
      now: () => new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(result.data.lineItems[0]).toEqual({
      description: "Hosting",
      quantity: 2,
      unitPrice: 10,
      amount: 20,
    });
    expect(result.fieldConfidence["lineItems.0.description"]).toBe(1);
    expect(result.fieldConfidence.supplierName).toBeUndefined();
    expect(result.rawExtraction).toMatchObject({
      provider: "csv",
      model: null,
      receivedAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("retries a model once when the payload fails schema parsing", async () => {
    let calls = 0;
    const gemini: ExtractionProvider = {
      id: "gemini",
      supports: () => true,
      async extract() {
        calls += 1;
        if (calls === 1) {
          return { providerId: "gemini", model: "fake", output: "not-json" };
        }
        return {
          providerId: "gemini",
          model: "fake",
          output: invoiceFields,
        };
      },
    };

    const result = await extractDocument({
      input: {
        fileBuffer: Buffer.from("pdf"),
        mimeType: "application/pdf",
        fileName: "invoice.pdf",
      },
      providers: [gemini],
    });

    expect(calls).toBe(2);
    expect(result.data.documentNumber).toBe("TXT-1");
    expect(result.fieldConfidence.total).toBe(0.4);
    expect(result.rawExtraction.output).toEqual(invoiceFields);
  });

  it("does not trust a model payload that still fails the schema", async () => {
    const gemini: ExtractionProvider = {
      id: "gemini",
      supports: () => true,
      async extract() {
        return {
          providerId: "gemini",
          model: "fake",
          output: {
            ...invoiceFields,
            fieldConfidence: [{ field: "total", confidence: 4 }],
          },
        };
      },
    };

    await expect(
      extractDocument({
        input: {
          fileBuffer: Buffer.from("pdf"),
          mimeType: "application/pdf",
          fileName: "invoice.pdf",
        },
        providers: [gemini],
      }),
    ).rejects.toBeInstanceOf(InvalidExtractionError);
  });
});
