function parseMoneyValue(value: string | number): number {
  if (typeof value === "number") return value;
  const trimmed = value
    .trim()
    .replace(/^RD\$\s*/i, "")
    .replace(/^DOP\s*/i, "");
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed.replace(/,/g, ""));
  }
  return Number(trimmed);
}

/**
 * Formats DOP amounts for display only. Rounds to an integer and uses
 * a dot as the thousands separator without changing the source value.
 */
export function formatCurrencyDOP(value?: string | number | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const num = parseMoneyValue(value);
  if (!Number.isFinite(num)) return String(value);

  const integer = Math.sign(num) * Math.round(Math.abs(num));
  const grouped = Math.abs(integer).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${integer < 0 ? "-" : ""}RD$ ${grouped}`;
}
