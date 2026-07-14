export const EXPENSE_CATEGORIES = [
  "Retribuciones por Servicios Independientes",
  "Servicios Públicos e Infraestructura",
  "Mantenimiento y Reparaciones",
  "Seguridad y Vigilancia",
  "Gastos Administrativos y Legales",
  "Combustibles y Movilidad",
  "Impuestos, Tasas y Contribuciones",
  "Otros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_SHORT_LABELS: Record<ExpenseCategory, string> = {
  "Retribuciones por Servicios Independientes": "Retribuciones",
  "Servicios Públicos e Infraestructura": "Serv. Públicos",
  "Mantenimiento y Reparaciones": "Mantenimiento",
  "Seguridad y Vigilancia": "Seguridad",
  "Gastos Administrativos y Legales": "Adm. y Legales",
  "Combustibles y Movilidad": "Combustibles",
  "Impuestos, Tasas y Contribuciones": "Impuestos",
  Otros: "Otros",
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Retribuciones por Servicios Independientes": "#2d5016",
  "Servicios Públicos e Infraestructura": "#5c3d1f",
  "Mantenimiento y Reparaciones": "#b06d3b",
  "Seguridad y Vigilancia": "#b8964c",
  "Gastos Administrativos y Legales": "#7a8536",
  "Combustibles y Movilidad": "#9aae93",
  "Impuestos, Tasas y Contribuciones": "#7c4d7f",
  Otros: "#c9b893",
};

function categoryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const CATEGORY_BY_KEY = new Map<string, ExpenseCategory>(
  EXPENSE_CATEGORIES.map((category) => [categoryKey(category), category])
);

const LEGACY_CATEGORY_ALIASES = new Map<string, ExpenseCategory>([
  ["sueldos y cargas sociales", "Retribuciones por Servicios Independientes"],
  ["suelds y cargas sociales", "Retribuciones por Servicios Independientes"],
  ["servicios publicos e infraestructura", "Servicios Públicos e Infraestructura"],
  ["seguridad", "Seguridad y Vigilancia"],
  ["mantenimiento", "Mantenimiento y Reparaciones"],
  ["luminarias", "Otros"],
]);

export function getCanonicalExpenseCategory(value: unknown): ExpenseCategory | null {
  if (typeof value !== "string") return null;
  const key = categoryKey(value);
  return CATEGORY_BY_KEY.get(key) ?? LEGACY_CATEGORY_ALIASES.get(key) ?? null;
}

export function normalizeExpenseCategory(value: unknown): ExpenseCategory {
  return getCanonicalExpenseCategory(value) ?? "Otros";
}

export function isValidExpenseCategory(value: unknown): boolean {
  return getCanonicalExpenseCategory(value) !== null;
}
