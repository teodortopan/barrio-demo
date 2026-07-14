/**
 * Get the current date/time in Argentina/Buenos Aires timezone.
 * Always use this instead of raw `new Date()` for any date logic.
 */
export function getArgentinaDate(): Date {
  const argentinaTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return new Date(argentinaTime);
}

/**
 * Get today's date string in YYYY-MM-DD format in Buenos Aires timezone.
 * Use this instead of `new Date().toISOString().split('T')[0]`.
 */
export function getArgentinaToday(): string {
  const d = getArgentinaDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get Argentina month name in Spanish.
 */
export function getArgentinaMonthName(date?: Date): string {
  const d = date ?? getArgentinaDate();
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return months[d.getMonth()];
}

/**
 * Validate (year, month, day) refer to a real calendar date. JavaScript's
 * `new Date(y, m-1, d)` silently rolls invalid days into the next month
 * (Feb 31 → Mar 3), so we round-trip and require the components to match.
 */
export function isValidYMD(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900 || y > 9999) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

/**
 * Validate (hours, minutes) is a real wall-clock time.
 */
export function isValidHM(h: number, m: number): boolean {
  return (
    Number.isFinite(h) && h >= 0 && h <= 23 &&
    Number.isFinite(m) && m >= 0 && m <= 59
  );
}
