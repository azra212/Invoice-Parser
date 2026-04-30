// backend/services/normalizers/documentNormalizer.ts

import { ExtractedData } from "../../models/documentTypes";

function cleanString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const str = String(value).trim();

  const lower = str.toLowerCase();

  if (
    !str ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "none" ||
    lower === "unknown" ||
    lower === "not provided"
  ) {
    return null;
  }

  return str;
}

function cleanNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") return value;

  const cleaned = String(value).replace(/[^\d.-]/g, "");
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
