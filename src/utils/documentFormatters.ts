export function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function displayMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export function formatStatus(status: string | null | undefined) {
  if (!status) return "—";
  return status.replace("_", " ");
}
