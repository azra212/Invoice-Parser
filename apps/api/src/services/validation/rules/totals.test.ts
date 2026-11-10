import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { totalsRule } from "./totals";

describe("totals", () => {
  it("flags a subtotal that does not match the line amounts", async () => {
    const issues = await totalsRule.validate(
      sampleDocument({ subtotal: 80 }),
      {},
    );

    expect(issues[0]).toMatchObject({
      field: "subtotal",
      severity: "error",
      code: "totals.subtotal",
    });
  });

  it("flags a total that is not subtotal plus tax", async () => {
    const issues = await totalsRule.validate(
      sampleDocument({ total: 999 }),
      {},
    );

    expect(issues[0]).toMatchObject({
      field: "total",
      severity: "error",
      code: "totals.total",
      message:
        "Total calculation error. Subtotal (100) + Tax (20) = 120, which differs from Total (999).",
    });
  });

  it("treats three-decimal currencies at their minor unit", async () => {
    const issues = await totalsRule.validate(
      sampleDocument({
        currency: "BHD",
        subtotal: 1.234,
        tax: 0.001,
        total: 1.235,
        lineItems: [
          {
            description: "Service",
            quantity: 1,
            unitPrice: 1.234,
            amount: 1.234,
          },
        ],
      }),
      {},
    );

    expect(issues).toEqual([]);
  });
});
