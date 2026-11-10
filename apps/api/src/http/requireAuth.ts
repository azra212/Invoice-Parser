import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { readAccessToken } from "../services/auth/tokens";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
};

declare global {
  // Express augments Request through a namespace. There is no module-syntax equivalent.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    const bearer = header?.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : undefined;
    const token = bearer || req.cookies?.access_token;

    if (!token) {
      next(new AppError("Sign in required.", 401, "UNAUTHENTICATED"));
      return;
    }

    try {
      const payload = readAccessToken(token, secret);
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        organizationId: payload.organizationId,
      };
      next();
    } catch {
      next(new AppError("Sign in required.", 401, "UNAUTHENTICATED"));
    }
  };
}
