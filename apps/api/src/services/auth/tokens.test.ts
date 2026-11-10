import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";
import { readAccessToken, signAccessToken } from "./tokens";

const secret = "test-secret-value-16";

describe("passwords", () => {
  it("hashes and checks a password", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("access tokens", () => {
  it("round-trips the user and organisation", () => {
    const token = signAccessToken(
      {
        sub: "user-1",
        email: "ada@example.com",
        name: "Ada",
        organizationId: "org-1",
      },
      secret,
    );

    expect(readAccessToken(token, secret)).toEqual({
      sub: "user-1",
      email: "ada@example.com",
      name: "Ada",
      organizationId: "org-1",
    });
  });

  it("rejects a token signed with another secret", () => {
    const token = signAccessToken(
      {
        sub: "user-1",
        email: "ada@example.com",
        name: "Ada",
        organizationId: "org-1",
      },
      secret,
    );
    expect(() => readAccessToken(token, "another-secret-value")).toThrow();
  });
});
