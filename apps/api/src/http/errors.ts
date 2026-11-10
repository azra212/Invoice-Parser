import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export type ErrorBody = {
  success: false;
  code: string;
  message: string;
  requestId?: string;
};

export function toErrorResponse(
  error: unknown,
  requestId?: string,
): { status: number; body: ErrorBody } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        code: error.code,
        message: error.message,
        requestId,
      },
    };
  }

  if (error instanceof Error && error.message.startsWith("Origin ")) {
    return {
      status: 403,
      body: {
        success: false,
        code: "ORIGIN_NOT_ALLOWED",
        message: error.message,
        requestId,
      },
    };
  }

  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "request";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    return {
      status: 400,
      body: {
        success: false,
        code: "VALIDATION_ERROR",
        message,
        requestId,
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      code: "REQUEST_FAILED",
      message: "Request failed",
      requestId,
    },
  };
}
