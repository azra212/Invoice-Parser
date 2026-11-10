import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: optionalText
    .transform((value) => value ?? "3000")
    .pipe(z.coerce.number().int().positive()),
  MONGO_URI: z
    .string({ required_error: "MONGO_URI is required" })
    .trim()
    .min(1, "MONGO_URI is required"),
  GEMINI_API_KEY: optionalText.transform((value) =>
    value && value !== "MY_GEMINI_API_KEY" ? value : undefined,
  ),
  GEMINI_MODEL: optionalText.transform(
    (value) => value ?? "gemini-3-flash-preview",
  ),
  CORS_ORIGINS: optionalText.transform(
    (value) => value ?? "http://localhost:5173",
  ),
  WEB_DIST_PATH: optionalText,
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment:\n${details}`);
  }

  return parsed.data;
}

export function allowedOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
