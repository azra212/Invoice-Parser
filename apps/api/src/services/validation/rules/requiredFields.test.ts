import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { requiredFieldsRule } from "./requiredFields";

describe("requiredFields", () => {
  it("accepts a complete document", async () => {
    expect(await requiredFieldsRule.validate(sampleDocument(), {})).toEqual([]);
  });

  it("reports each missing field", async () => {
    const issues = await requiredFieldsRule.validate(
      sampleDocument({
        documentType: null,
        supplierName: null,
        documentNumber: null,
        issueDate: null,
        dueDate: null,
        currency: null,
        total: null,
      }),
      {},
    );

    expect(issues.map((item) => item.field)).toEqual([
      "documentType",
      "supplierName",
      "documentNumber",
      "issueDate",
      "dueDate",
      "currency",
      "total",
    ]);
    expect(issues.every((item) => item.severity === "error")).toBe(true);
    expect(issues.every((item) => item.code.startsWith("required."))).toBe(
      true,
    );
  });
});
