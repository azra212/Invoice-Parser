import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/AppError";
import { parseInput } from "../http/schemas";
import { Organization } from "../models/Organization";
import { User } from "../models/User";
import { hashPassword, verifyPassword } from "../services/auth/passwords";
import { readAccessToken, signAccessToken } from "../services/auth/tokens";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const COOKIE = "access_token";
const WEEK = 7 * 24 * 60 * 60 * 1000;

type SessionUser = {
  _id: unknown;
  email: string;
  name: string;
  organizationId: unknown;
};

export function createAuthRouter(options: {
  jwtSecret: string;
  secureCookies: boolean;
}) {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const input = parseInput(registerSchema, req.body);
      const email = input.email.toLowerCase();
      const existing = await User.findOne({ email }).select("_id");
      if (existing) {
        throw new AppError(
          "An account with that email already exists.",
          409,
          "EMAIL_IN_USE",
        );
      }

      const organization = await Organization.create({
        name: `${input.name}'s workspace`,
      });
      const user = await User.create({
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        organizationId: organization._id,
      });
      sendSession(res, user, options, 201);
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const input = parseInput(loginSchema, req.body);
      const user = await User.findOne({ email: input.email.toLowerCase() });
      const valid = await verifyPassword(
        input.password,
        user?.passwordHash ?? "",
      );
      if (!user || !valid) {
        throw new AppError(
          "Email or password is incorrect.",
          401,
          "INVALID_LOGIN",
        );
      }
      sendSession(res, user, options, 200);
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", (_req, res) => {
    res.clearCookie(COOKIE, cookieOptions(options.secureCookies));
    res.json({ success: true });
  });

  router.get("/me", (req, res, next) => {
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
      const payload = readAccessToken(token, options.jwtSecret);
      res.json({
        success: true,
        data: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          organizationId: payload.organizationId,
        },
      });
    } catch {
      next(new AppError("Sign in required.", 401, "UNAUTHENTICATED"));
    }
  });

  return router;
}

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: WEEK,
  };
}

function sendSession(
  res: Response,
  user: SessionUser,
  options: { jwtSecret: string; secureCookies: boolean },
  status: number,
) {
  const token = signAccessToken(
    {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      organizationId: String(user.organizationId),
    },
    options.jwtSecret,
  );
  res.cookie(COOKIE, token, cookieOptions(options.secureCookies));
  res.status(status).json({
    success: true,
    data: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      organizationId: String(user.organizationId),
    },
  });
}
