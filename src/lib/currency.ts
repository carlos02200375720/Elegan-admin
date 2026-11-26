function parseIntegerMoney(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  const trimmed = value.trim().replace(/^RD\$\s*/i, "").replace(/^DOP\s*/i, "");
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Formats only whole amounts using a dot thousands separator and the $ symbol. */
export function formatCurrencyDOP(value?: string | number | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const integer = parseIntegerMoney(value);
  if (integer === null) return null;
  return "$" + integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
