import { ExtractedData, LineItem } from "../../../models/documentTypes";

export function emptyExtractedData(): ExtractedData {
  return {
    documentType: null,
    supplierName: null,
    documentNumber: null,
    issueDate: null,
    dueDate: null,
    currency: null,
    lineItems: [],
    subtotal: null,
    tax: null,
    total: null,
  };
}

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

export function pickValue(
  record: Record<string, unknown>,
  aliases: string[],
): unknown {
  const wanted = new Set(aliases.map(normalizeHeader));

  for (const [key, value] of Object.entries(record)) {
    if (wanted.has(normalizeHeader(key))) {
      return value;
    }
  }

  return null;
}

export function hasAnyLineItemValue(item: LineItem): boolean {
  return Boolean(
    item.description ||
    item.quantity !== null ||
    item.unitPrice !== null ||
    item.amount !== null,
  );
}

export function cleanCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text ? text : null;
}
