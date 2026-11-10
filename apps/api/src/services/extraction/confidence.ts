import type { ExtractedData } from "@invoice-parser/shared";

const TOP_LEVEL_FIELDS = [
  "documentType",
  "supplierName",
  "documentNumber",
  "issueDate",
  "dueDate",
  "currency",
  "subtotal",
  "tax",
  "total",
] as const;

export function confidenceForKnownValues(
  data: ExtractedData,
): Record<string, number> {
  const confidence: Record<string, number> = {};

  for (const field of TOP_LEVEL_FIELDS) {
    if (data[field] !== null && data[field] !== undefined) {
      confidence[field] = 1;
    }
  }

  data.lineItems.forEach((item, index) => {
    const fields = ["description", "quantity", "unitPrice", "amount"] as const;
    for (const field of fields) {
      if (
        item[field] !== null &&
        item[field] !== undefined &&
        item[field] !== ""
      ) {
        confidence[`lineItems.${index}.${field}`] = 1;
      }
    }
  });

  return confidence;
}
