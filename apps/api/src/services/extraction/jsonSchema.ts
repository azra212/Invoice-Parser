import { z } from "zod";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeNode(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => sanitizeNode(item));
  }

  if (!isRecord(node)) return node;

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue;
    next[key] = sanitizeNode(value);
  }

  if (
    Array.isArray(next.type) &&
    next.type.every((item) => typeof item === "string")
  ) {
    const types = next.type as string[];
    delete next.type;
    const existing = Array.isArray(next.anyOf) ? next.anyOf : [];
    next.anyOf = [...existing, ...types.map((type) => ({ type }))];
  }

  return next;
}

export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema);
  const sanitized = sanitizeNode(generated);
  if (!isRecord(sanitized)) {
    throw new Error("Zod did not produce a JSON schema object.");
  }
  return sanitized;
}
