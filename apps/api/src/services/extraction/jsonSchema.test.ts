import { modelExtractionSchema } from "@invoice-parser/shared";
import { describe, expect, it } from "vitest";
import { toGeminiJsonSchema } from "./jsonSchema";

describe("toGeminiJsonSchema", () => {
  it("builds a Gemini JSON schema from the Zod extraction contract", () => {
    const schema = toGeminiJsonSchema(modelExtractionSchema);
    const properties = schema.properties as Record<string, unknown>;
    const total = properties.total as { anyOf?: Array<{ type?: string }> };

    expect(schema.$schema).toBeUndefined();
    expect(schema.type).toBe("object");
    expect(properties.supplierName).toBeDefined();
    expect(properties.lineItems).toBeDefined();
    expect(properties.fieldConfidence).toBeDefined();
    expect(total.anyOf?.some((branch) => branch.type === "null")).toBe(true);
    expect(JSON.stringify(total)).not.toContain('["number","null"]');
  });
});
