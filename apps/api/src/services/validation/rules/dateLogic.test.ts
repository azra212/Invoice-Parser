import { describe, expect, it } from "vitest";
import { sampleDocument } from "../sampleDocument";
import { dateLogicRule } from "./dateLogic";

describe("dateLogic", () => {
  it("accepts an issue date on or before the due date", async () => {
    expect(await dateLogicRule.validate(sampleDocument(), {})).toEqual([]);
  });

  it("rejects a due date before the issue date", async () => {
    const issues = await dateLogicRule.validate(
      sampleDocument({ issueDate: "2025-01-10", dueDate: "2025-01-01" }),
      {},
    );

    expect(issues).toEqual([
      {
        field: "dueDate",
        message: "Due date cannot be before issue date.",
        severity: "error",
        code: "date.order",
      },
    ]);
  });

  it("rejects dates that are not full ISO dates", async () => {
    const issues = await dateLogicRule.validate(
      sampleDocument({ issueDate: "14/03/2025", dueDate: "next month" }),
      {},
    );

    expect(issues.map((item) => item.code)).toEqual([
      "date.issueDate",
      "date.dueDate",
    ]);
  });
});
