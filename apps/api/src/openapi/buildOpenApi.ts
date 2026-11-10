import {
  documentStatusSchema,
  extractedDataSchema,
  processedDocumentSchema,
  validationIssueSchema,
} from "@invoice-parser/shared";
import { z } from "zod";
import { updateDocumentSchema } from "../http/schemas";

const listDocumentsQueryJson = z.object({
  status: documentStatusSchema.optional(),
  q: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

function schemaOf(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema) as Record<string, unknown>;
  delete generated.$schema;
  return generated;
}

export function buildOpenApi() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Invoice Parser API",
      version: "1.0.0",
      description:
        "Upload invoices and purchase orders, extract structured fields, validate them, and review the result.",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/health": {
        get: {
          summary: "Service health",
          responses: { "200": { description: "MongoDB is reachable" } },
        },
      },
      "/documents": {
        get: {
          summary: "List documents",
          parameters: [
            {
              name: "status",
              in: "query",
              schema: schemaOf(documentStatusSchema),
            },
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "A page of documents" } },
        },
      },
      "/documents/upload": {
        post: {
          summary: "Upload a document",
          responses: { "202": { description: "Accepted for processing" } },
        },
      },
      "/documents/{id}": {
        patch: {
          summary: "Update and revalidate a document",
          responses: { "200": { description: "Updated document" } },
        },
        delete: {
          summary: "Delete a document",
          responses: { "200": { description: "Deleted document" } },
        },
      },
      "/documents/{id}/reprocess": {
        post: {
          summary: "Reprocess a document",
          responses: { "202": { description: "Reprocessing accepted" } },
        },
      },
      "/openapi.json": {
        get: {
          summary: "This document",
          responses: { "200": { description: "OpenAPI document" } },
        },
      },
    },
    components: {
      schemas: {
        ExtractedData: schemaOf(extractedDataSchema),
        ProcessedDocument: schemaOf(processedDocumentSchema),
        ValidationIssue: schemaOf(validationIssueSchema),
        ListDocumentsQuery: schemaOf(listDocumentsQueryJson),
        UpdateDocument: schemaOf(updateDocumentSchema),
      },
    },
  };
}
