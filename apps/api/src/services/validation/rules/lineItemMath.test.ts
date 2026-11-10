import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { lineItemMathRule } from "./lineItemMath";

describe("lineItemMath", () => {
  it("warns when quantity times price does not match the amount", async () => {
    const document = sampleDocument();
    document.lineItems[0]!.amount = 90;
    const issues = await lineItemMathRule.validate(document, {});

    expect(issues).toEqual([
      {
        field: "lineItems[0].amount",
        message: 'Amount mismatch for item "Hosting". Expected 100.',
        severity: "warning",
        code: "line.math",
      },
    ]);
  });

  it("rounds to the currency minor unit before comparing", async () => {
    const document = sampleDocument({ currency: "JPY" });
    document.lineItems[0] = {
      description: "Support",
      quantity: 1,
      unitPrice: 100.4,
      amount: 100,
    };

    expect(await lineItemMathRule.validate(document, {})).toEqual([]);
  });

  it("warns when a line field is missing", async () => {
    const document = sampleDocument();
    document.lineItems[0] = {
      description: null,
      quantity: null,
      unitPrice: null,
      amount: null,
    };

    expect(
      (await lineItemMathRule.validate(document, {})).map((item) => item.code),
    ).toEqual([
      "line.description",
      "line.quantity",
      "line.unitPrice",
      "line.amount",
    ]);
  });
});
