import { ExtractedData } from "../../models/documentTypes";
import { cleanCell, emptyExtractedData } from "./helpers/parserUtils";

const FIELD_ALIASES: Record<keyof Omit<ExtractedData, "lineItems">, string[]> =
  {
    documentType: ["document type", "type"],
    supplierName: ["supplier", "supplier name", "vendor", "company"],
    documentNumber: [
      "document number",
      "invoice number",
      "invoice no",
      "invoice #",
      "po number",
      "po no",
    ],
    issueDate: ["issue date", "invoice date", "date"],
    dueDate: ["due date", "payment due"],
    currency: ["currency"],
    subtotal: ["subtotal", "sub total"],
    tax: ["tax", "vat", "sales tax"],
    total: ["total", "grand total", "amount due", "balance due"],
  };

const CURRENCY_CODES = ["EUR", "USD", "GBP", "BAM", "CHF", "RSD", "HRK"];

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9#]+/g, " ")
    .replace(/\s+/g, " ");
}

function findField(
  label: string,
): keyof Omit<ExtractedData, "lineItems"> | null {
  const normalized = normalizeLabel(label);

  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => normalizeLabel(alias) === normalized)) {
      return field as keyof Omit<ExtractedData, "lineItems">;
    }
  }

  return null;
}

function normalizeDocumentType(value: string | null) {
  const normalized = value
    ?.toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  if (normalized === "invoice" || normalized === "purchase_order") {
    return normalized;
  }

  return value;
}

function extractCurrency(value: string | null): string | null {
  if (!value) return null;

  const upperValue = value.toUpperCase();

  return (
    CURRENCY_CODES.find((currency) =>
      new RegExp(`\\b${currency}\\b`).test(upperValue),
    ) ?? null
  );
}

function parseLeadingDocumentLine(lines: string[], document: ExtractedData) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const invoiceMatch = trimmed.match(/^invoice\s+(.+)$/i);
    if (invoiceMatch) {
      document.documentType = "invoice";
      document.documentNumber = cleanCell(invoiceMatch[1]);
      return;
    }

    const purchaseOrderMatch = trimmed.match(/^(purchase order|po)\s+(.+)$/i);
    if (purchaseOrderMatch) {
      document.documentType = "purchase_order";
      document.documentNumber = cleanCell(purchaseOrderMatch[2]);
      return;
    }
  }
}

function parseKeyValueLines(lines: string[], document: ExtractedData) {
  for (const line of lines) {
    const match = line.match(/^\s*([^:=-]{2,40})\s*[:=-]\s*(.+?)\s*$/);
    if (!match) continue;

    const field = findField(match[1]);
    if (!field) continue;

    const value = cleanCell(match[2]);

    if (field === "documentType") {
      document.documentType = normalizeDocumentType(
        value,
      ) as ExtractedData["documentType"];
      continue;
    }

    if (field === "total" && !document.currency) {
      document.currency = extractCurrency(value);
    }

    if (field === "subtotal" && !document.currency) {
      document.currency = extractCurrency(value);
    }

    if (field === "tax" && !document.currency) {
      document.currency = extractCurrency(value);
    }

    (document as any)[field] = value;
  }
}

function splitTableLine(line: string): string[] {
  if (line.includes("|")) {
    return line
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  if (line.includes("\t")) {
    return line
      .split("\t")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return line
    .split(/\s{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseSimpleLineItems(lines: string[], document: ExtractedData) {
  const headerIndex = lines.findIndex((line) => {
    const columns = splitTableLine(line).map((col) => normalizeLabel(col));

    return (
      columns.some((col) =>
        ["description", "desc", "item", "service", "product"].includes(col),
      ) &&
      columns.some((col) =>
        ["quantity", "qty", "units", "hours"].includes(col),
      ) &&
      columns.some((col) =>
        ["amount", "line amount", "line total", "total"].includes(col),
      )
    );
  });

  if (headerIndex === -1) return;

  const headers = splitTableLine(lines[headerIndex]).map((header) =>
    normalizeLabel(header).replace(/\s+/g, ""),
  );

  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim() || /^[-|\s]+$/.test(line)) continue;

    const cells = splitTableLine(line);
    if (cells.length < 2) continue;

    const row: Record<string, string | null> = {};

    headers.forEach((header, index) => {
      row[header] = cleanCell(cells[index]);
    });

    const description =
      row.description ??
      row.desc ??
      row.item ??
      row.service ??
      row.product ??
      null;

    const quantity = row.quantity ?? row.qty ?? row.units ?? row.hours ?? null;

    const unitPrice = row.unitprice ?? row.price ?? row.rate ?? null;

    const amount =
      row.amount ?? row.lineamount ?? row.linetotal ?? row.total ?? null;

    if (!description && !quantity && !unitPrice && !amount) continue;

    document.lineItems.push({
      description,
      quantity: quantity as any,
      unitPrice: unitPrice as any,
      amount: amount as any,
    });
  }
}

export class TxtParser {
  static extractData(fileBuffer: Buffer): ExtractedData {
    const document = emptyExtractedData();
    const lines = fileBuffer.toString("utf-8").split(/\r?\n/);

    parseLeadingDocumentLine(lines, document);
    parseKeyValueLines(lines, document);
    parseSimpleLineItems(lines, document);

    return document;
  }
}
