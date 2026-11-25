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
 * Formats DOP currency amounts with dot thousands separators and omits
 * trailing `.00` decimals (e.g., 1500 or 1500.00 -> "RD$ 1.500").
 */
export function formatCurrencyDOP(value?: string | number | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const num = parseMoneyValue(value);
  if (!Number.isFinite(num)) return String(value);

  const negative = num < 0;
  const abs = Math.abs(num);
  const rounded = Math.round(abs * 100) / 100;
  const hasDecimals = Math.abs(rounded - Math.trunc(rounded)) > 1e-9;

  const [intPart, decPart] = (
    hasDecimals ? rounded.toFixed(2) : Math.trunc(rounded).toString()
  ).split(".");
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formattedNumber = hasDecimals ? `${groupedInt},${decPart}` : groupedInt;

  return `${negative ? "-" : ""}RD$ ${formattedNumber}`;
}
