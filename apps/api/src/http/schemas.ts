import {
  documentStatusSchema,
  extractedDataSchema,
  lineItemSchema,
} from "@invoice-parser/shared";
import { z } from "zod";

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid document ID.");

export const documentIdSchema = z.object({
  id: objectId,
});

function boundedInt(fallback: number, max: number) {
  return z
    .string()
    .optional()
    .transform((value, context) => {
      if (!value || !value.trim()) return fallback;
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
        context.addIssue({
          code: "custom",
          message: `must be an integer from 1 to ${max}`,
        });
        return z.NEVER;
      }
      return parsed;
    });
}

export const listDocumentsQuerySchema = z.object({
  status: documentStatusSchema.optional(),
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  page: boundedInt(1, 1000),
  limit: boundedInt(50, 100),
});

export const updateDocumentSchema = extractedDataSchema.partial().extend({
  status: documentStatusSchema.optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentSchema>;

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}
