// backend/services/normalizers/documentNormalizer.ts

import { ExtractedData } from "../../models/documentTypes";

const NULL_STRINGS = new Set([
  "null",
  "undefined",
  "n/a",
  "na",
  "none",
  "unknown",
  "not provided",
]);

function isNullishString(value: string) {
  return !value || NULL_STRINGS.has(value.toLowerCase());
}

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();

  const lower = str.toLowerCase();

  if (isNullishString(str)) {
    return null;
  }

  return str;
}

function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const str = String(value).trim();

  if (isNullishString(str)) {
    return null;
  }

  // Keep only digits, comma, dot, and minus sign
  let cleaned = str.replace(/[^\d,.-]/g, "");

  if (!cleaned) {
    return null;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    // Whichever separator appears last is most likely the decimal separator
    if (lastComma > lastDot) {
      // European format: 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // US/UK format: 1,234.56 -> 1234.56
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    const commaParts = cleaned.split(",");

    if (commaParts.length === 2 && commaParts[1].length <= 2) {
      // Decimal comma: 99,99 -> 99.99
      cleaned = cleaned.replace(",", ".");
    } else {
      // Thousands commas: 1,234 -> 1234
      cleaned = cleaned.replace(/,/g, "");
    }
  } else {
    // No comma issue; remove thousands separators only if needed
    cleaned = cleaned;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeExtractedData(raw: any): ExtractedData {
  return {
    documentType:
      raw.documentType === "invoice" || raw.documentType === "purchase_order"
        ? raw.documentType
        : null,

    supplierName: cleanString(raw.supplierName),
    documentNumber: cleanString(raw.documentNumber),

    issueDate: cleanString(raw.issueDate),
    dueDate: cleanString(raw.dueDate),

    currency: cleanString(raw.currency)?.toUpperCase() ?? null,

    lineItems: Array.isArray(raw.lineItems)
      ? raw.lineItems.map((item: any) => ({
          description: cleanString(item.description),
          quantity: cleanNumber(item.quantity),
          unitPrice: cleanNumber(item.unitPrice),
          amount: cleanNumber(item.amount),
        }))
      : [],

    subtotal: cleanNumber(raw.subtotal),
    tax: cleanNumber(raw.tax),
    total: cleanNumber(raw.total),
  };
}
