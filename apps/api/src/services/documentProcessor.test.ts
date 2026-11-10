import { describe, expect, it } from "vitest";
import { canRunAttempt } from "./documentProcessor";

describe("canRunAttempt", () => {
  it("accepts the current uploaded or processing attempt", () => {
    expect(
      canRunAttempt({ status: "uploaded", processingAttempt: 2 }, 2),
    ).toBe(true);
    expect(
      canRunAttempt({ status: "processing", processingAttempt: 2 }, 2),
    ).toBe(true);
  });

  it("ignores stale attempts and finished documents", () => {
    expect(
      canRunAttempt({ status: "uploaded", processingAttempt: 3 }, 2),
    ).toBe(false);
    expect(
      canRunAttempt({ status: "validated", processingAttempt: 2 }, 2),
    ).toBe(false);
    expect(canRunAttempt({ status: "failed", processingAttempt: 2 }, 2)).toBe(
      false,
    );
  });
});
