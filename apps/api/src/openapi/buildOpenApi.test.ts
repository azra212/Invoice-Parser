import { describe, expect, it } from "vitest";
import { buildOpenApi } from "./buildOpenApi";

describe("buildOpenApi", () => {
  it("publishes the document contract generated from Zod", () => {
    const spec = buildOpenApi();
    const extracted = spec.components.schemas.ExtractedData as {
      properties?: Record<string, unknown>;
    };

    expect(spec.openapi).toBe("3.0.3");
    expect(spec.paths["/documents/upload"]).toBeDefined();
    expect(extracted.properties?.documentNumber).toBeDefined();
    expect(extracted.properties?.lineItems).toBeDefined();
    expect(JSON.stringify(spec)).not.toContain('"$schema"');
  });
});
