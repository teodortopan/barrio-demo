export function parseArgentineCurrency(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let cleaned = String(value).trim().replace(/[$€\s]/g, "");
  if (!cleaned) return 0;

  const negative = cleaned.startsWith("-");
  cleaned = cleaned.replace(/^-/, "");

  if (cleaned.includes(",")) {
    const [intPart, decPart = "0"] = cleaned.split(",");
    const normalizedInt = intPart.replace(/\./g, "");
    const parsed = parseFloat(`${normalizedInt}.${decPart}`);
    return (negative ? -1 : 1) * (Number.isFinite(parsed) ? parsed : 0);
  }

  const dotCount = (cleaned.match(/\./g) || []).length;
  if (dotCount > 0) {
    if (dotCount === 1 && !/\.\d{3}$/.test(cleaned)) {
      const parsed = parseFloat(cleaned);
      return (negative ? -1 : 1) * (Number.isFinite(parsed) ? parsed : 0);
    }
    cleaned = cleaned.replace(/\./g, "");
  }

  const parsed = parseFloat(cleaned);
  return (negative ? -1 : 1) * (Number.isFinite(parsed) ? parsed : 0);
}
