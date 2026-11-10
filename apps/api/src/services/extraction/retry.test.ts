import { describe, expect, it } from "vitest";
import {
  isAuthenticationError,
  isRetryableTransportError,
  withRetry,
} from "./retry";

describe("transport retry classification", () => {
  it("retries rate limits, server errors, and timeouts", () => {
    expect(
      isRetryableTransportError({ status: 429, message: "slow down" }),
    ).toBe(true);
    expect(isRetryableTransportError({ status: 503, message: "down" })).toBe(
      true,
    );
    expect(
      isRetryableTransportError(
        Object.assign(new Error("aborted"), { name: "TimeoutError" }),
      ),
    ).toBe(true);
    expect(isRetryableTransportError(new Error("RESOURCE_EXHAUSTED"))).toBe(
      true,
    );
  });

  it("does not retry authentication failures", () => {
    const error = Object.assign(new Error("API key invalid"), { status: 401 });

    expect(isAuthenticationError(error)).toBe(true);
    expect(isRetryableTransportError(error)).toBe(false);
  });
});

describe("withRetry", () => {
  it("backs off and then returns the successful attempt", async () => {
    const sleeps: number[] = [];
    let calls = 0;

    const value = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) {
          throw Object.assign(new Error("busy"), { status: 429 });
        }
        return "ok";
      },
      {
        attempts: 3,
        timeoutMs: 1000,
        baseDelayMs: 20,
        shouldRetry: isRetryableTransportError,
        sleep: async (ms) => {
          sleeps.push(ms);
        },
      },
    );

    expect(value).toBe("ok");
    expect(calls).toBe(3);
    expect(sleeps).toEqual([20, 40]);
  });

  it("stops immediately on an authentication error", async () => {
    let calls = 0;

    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw Object.assign(new Error("bad key"), { status: 401 });
        },
        {
          attempts: 3,
          timeoutMs: 1000,
          baseDelayMs: 20,
          shouldRetry: isRetryableTransportError,
          sleep: async () => undefined,
        },
      ),
    ).rejects.toThrow(/bad key/);

    expect(calls).toBe(1);
  });
});
