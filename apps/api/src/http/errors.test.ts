import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { toErrorResponse } from "./errors";

describe("toErrorResponse", () => {
  it("keeps application errors and attaches the request id", () => {
    const response = toErrorResponse(
      new AppError("Missing file", 400, "NO_FILE_UPLOADED"),
      "req-1",
    );

    expect(response).toEqual({
      status: 400,
      body: {
        success: false,
        code: "NO_FILE_UPLOADED",
        message: "Missing file",
        requestId: "req-1",
      },
    });
  });

  it("turns Zod failures into a validation error", () => {
    const parsed = z.object({ page: z.string() }).safeParse({});
    if (parsed.success) throw new Error("expected a schema failure");

    const response = toErrorResponse(parsed.error, "req-2");
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toContain("page");
  });

  it("hides unexpected errors", () => {
    const response = toErrorResponse(new Error("secret stack"), "req-3");
    expect(response.status).toBe(500);
    expect(response.body.message).toBe("Request failed");
  });
});
