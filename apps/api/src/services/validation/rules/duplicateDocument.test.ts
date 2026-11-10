import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { duplicateDocumentRule } from "./duplicateDocument";

describe("duplicateDocument", () => {
  it("ignores the same number from a different supplier", async () => {
    const issues = await duplicateDocumentRule.validate(sampleDocument(), {
      findDuplicate: async () => null,
    });

    expect(issues).toEqual([]);
  });

  it("flags the same supplier and document number", async () => {
    const issues = await duplicateDocumentRule.validate(sampleDocument(), {
      currentDocumentId: "current",
      findDuplicate: async (input) => {
        expect(input).toEqual({
          supplierName: "Acme Ltd",
          documentNumber: "INV-001",
          currentDocumentId: "current",
        });
        return { id: "other" };
      },
    });

    expect(issues[0]).toMatchObject({
      field: "documentNumber",
      severity: "error",
      code: "duplicate.document",
    });
  });

  it("skips the lookup when supplier or number is missing", async () => {
    let calls = 0;
    const issues = await duplicateDocumentRule.validate(
      sampleDocument({ supplierName: null }),
      {
        findDuplicate: async () => {
          calls += 1;
          return { id: "other" };
        },
      },
    );

    expect(issues).toEqual([]);
    expect(calls).toBe(0);
  });
});
