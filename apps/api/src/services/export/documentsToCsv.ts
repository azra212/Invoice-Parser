const COLUMNS = [
  "documentNumber",
  "supplierName",
  "issueDate",
  "dueDate",
  "currency",
  "subtotal",
  "tax",
  "total",
  "status",
] as const;

function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function documentsToCsv(
  documents: Array<Record<string, unknown>>,
): string {
  const lines = [COLUMNS.join(",")];
  for (const document of documents) {
    lines.push(COLUMNS.map((column) => cell(document[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}
