import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("requires MONGO_URI", () => {
    expect(() => parseEnv({})).toThrow(/MONGO_URI/);
  });

  it("applies defaults for local development", () => {
    const env = parseEnv({
      MONGO_URI: "mongodb://127.0.0.1:27017/invoice-parser",
      JWT_SECRET: "dev-only-change-me-please",
    });

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("development");
    expect(env.GEMINI_MODEL).toBe("gemini-3-flash-preview");
    expect(env.CORS_ORIGINS).toBe("http://localhost:5173");
    expect(env.GEMINI_API_KEY).toBeUndefined();
  });

  it("treats the sample Gemini key as unset", () => {
    const env = parseEnv({
      MONGO_URI: "mongodb://127.0.0.1:27017/invoice-parser",
      JWT_SECRET: "dev-only-change-me-please",
      GEMINI_API_KEY: "MY_GEMINI_API_KEY",
      PORT: "4000",
    });

    expect(env.GEMINI_API_KEY).toBeUndefined();
    expect(env.PORT).toBe(4000);
  });
});
