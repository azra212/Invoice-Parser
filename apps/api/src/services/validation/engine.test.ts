import { describe, expect, it } from "vitest";
import { statusForIssues, validateDocument } from "./engine";
import { sampleDocument } from "./sampleDocument";

describe("validateDocument", () => {
  it("returns no issues for a valid document", async () => {
    const issues = await validateDocument(sampleDocument(), {
      findDuplicate: async () => null,
    });

    expect(issues).toEqual([]);
    expect(statusForIssues(issues)).toBe("validated");
  });

  it("needs review when any rule reports an error", async () => {
    const issues = await validateDocument(sampleDocument({ total: null }));

    expect(statusForIssues(issues)).toBe("needs_review");
  });
});
