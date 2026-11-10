import { describe, expect, it } from "vitest";
import { AppError } from "../../errors/AppError";
import { GeminiProvider } from "./geminiProvider";
import type { GeminiClient } from "./types";

const validPayload = {
  documentType: "invoice",
  supplierName: "Acme Ltd",
  documentNumber: "INV-1",
  issueDate: "2025-01-01",
  dueDate: "2025-01-10",
  currency: "EUR",
  lineItems: [],
  subtotal: 10,
  tax: 2,
  total: 12,
  fieldConfidence: [],
};

describe("GeminiProvider", () => {
  it("retries a rate limit and then returns the raw JSON payload", async () => {
    let calls = 0;
    const client: GeminiClient = {
      async generate() {
        calls += 1;
        if (calls === 1) {
          throw Object.assign(new Error("RESOURCE_EXHAUSTED"), { status: 429 });
        }
        return { text: JSON.stringify(validPayload) };
      },
    };

    const provider = new GeminiProvider({
      apiKey: "test-key",
      model: "fake-model",
      client,
      sleep: async () => undefined,
    });
    const result = await provider.extract({
      fileBuffer: Buffer.from("%PDF"),
      mimeType: "application/pdf",
      fileName: "invoice.pdf",
    });

    expect(calls).toBe(2);
    expect(result.model).toBe("fake-model");
    expect(result.output).toEqual(validPayload);
  });

  it("does not retry an authentication failure", async () => {
    let calls = 0;
    const client: GeminiClient = {
      async generate() {
        calls += 1;
        throw Object.assign(new Error("API key not valid"), { status: 401 });
      },
    };

    const provider = new GeminiProvider({
      apiKey: "test-key",
      client,
      sleep: async () => undefined,
    });

    await expect(
      provider.extract({
        fileBuffer: Buffer.from("%PDF"),
        mimeType: "application/pdf",
        fileName: "invoice.pdf",
      }),
    ).rejects.toMatchObject({ code: "AI_NOT_CONFIGURED" });
    expect(calls).toBe(1);
  });

  it("refuses to call the model without an API key", async () => {
    const provider = new GeminiProvider({ apiKey: undefined, model: "fake" });

    await expect(
      provider.extract({
        fileBuffer: Buffer.from("%PDF"),
        mimeType: "application/pdf",
        fileName: "invoice.pdf",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
