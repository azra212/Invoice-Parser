import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

function sendLimit(req: Request, res: Response) {
  res.status(429).json({
    success: false,
    code: "RATE_LIMITED",
    message: "Too many requests. Please wait and try again.",
    requestId: req.id,
  });
}

const skip = () => process.env.NODE_ENV === "test";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: sendLimit,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: sendLimit,
});
