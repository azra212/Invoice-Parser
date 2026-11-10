import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { vatRateRule } from "./vatRate";

describe("vatRate", () => {
  it("accepts a common 20% rate", async () => {
    expect(await vatRateRule.validate(sampleDocument(), {})).toEqual([]);
  });

  it("accepts zero tax", async () => {
    expect(
      await vatRateRule.validate(sampleDocument({ tax: 0, total: 100 }), {}),
    ).toEqual([]);
  });

  it("errors when tax is negative or above 30%", async () => {
    expect(
      (await vatRateRule.validate(sampleDocument({ tax: -1 }), {}))[0]?.code,
    ).toBe("vat.negative");
    expect(
      (await vatRateRule.validate(sampleDocument({ tax: 40 }), {}))[0]?.code,
    ).toBe("vat.rate");
  });

  it("warns on an unusual positive rate", async () => {
    const issues = await vatRateRule.validate(sampleDocument({ tax: 12 }), {});

    expect(issues).toEqual([
      expect.objectContaining({
        field: "tax",
        severity: "warning",
        code: "vat.unknown",
      }),
    ]);
  });
});
