// ── Demo seed data (fictional "Barrio Demo") ────────────────────────
//
// Single source of truth for every example value the demo shows. Consumed by:
//  - lib/data/fetchers.ts (server-rendered pages, via isDemoMode() early-returns)
//  - lib/demo/api-seed.ts (client widgets, via the browser fetch adapter)
//
// Browser-safe (no Node APIs). Date-sensitive data is
// exposed as FUNCTIONS anchored to getArgentinaToday() so a long-running demo
// stays "current". All names/lots/numbers are invented — no real resident.

import type {
  VecinoData,
  DeudorRow,
  ExpenseRow,
  AdminProfile,
  AdminComplaint,
  UserComplaint,
  UserVisit,
  Reminder,
  NotificationData,
  CalendarEvent,
  Ingresante,
  CurrentShift,
  Recorrido,
  GuardShift,
  ConsumoElectricoRow,
  CuotaDetailRow,
  PaymentPricesData,
  BibliotecaFile,
  AsambleaFile,
  VecinoHistoryEntry,
  ConsejoContactProfile,
  TotalPaymentsData,
} from "@/lib/demo/types";
import { getArgentinaDate, getArgentinaToday, getArgentinaMonthName } from "@/lib/utils/argentina-date";
import { DEMO_PROFILE_ID, DEMO_USER_ID, DEMO_USER_NAME, DEMO_USER_EMAIL } from "./demo-user";

// ── date helpers ────────────────────────────────────────────────────
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function periodLabel(): string {
  const d = getArgentinaDate();
  return `${capitalize(getArgentinaMonthName(d))} ${d.getFullYear()}`;
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoDaysAgo(n: number): string {
  const d = getArgentinaDate();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function ymdFromNow(n: number): string {
  const d = getArgentinaDate();
  d.setDate(d.getDate() + n);
  return ymd(d);
}
function thisMonthDay(day: number): string {
  const d = getArgentinaDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Vecinos (lotes 1–60; ~44 occupied, rest vacant on the map) ──────
// estado is kept to {"Al día","Deudor","-"} so the map (reads estado) and the
// charts (recompute saldo>0 ? Deudor : Al día) always agree.
type Estado = "Al día" | "Deudor" | "-";
// [lote, propietario, cargo, pago, saldo, estado]
const VEC: [number, string, number, number, number, Estado][] = [
  [1, "Lucía Fernández", 285000, 285000, 0, "Al día"],
  [2, "Diego Romero", 285000, 0, 512000, "Deudor"],
  [3, "Sofía Herrera", 285000, 285000, 0, "Al día"],
  [4, "Pablo Martínez", 285000, 285000, 0, "Al día"],
  [5, "Valentina Díaz", 285000, 140000, 430000, "Deudor"],
  [6, "Javier Sosa", 285000, 285000, 0, "Al día"],
  [7, DEMO_USER_NAME, 285000, 285000, 0, "Al día"], // demo resident
  [8, "Carla Benítez", 285000, 285000, 0, "Al día"],
  [9, "Andrés Molina", 285000, 0, 855000, "Deudor"],
  [10, "Florencia Ríos", 285000, 285000, 0, "Al día"],
  [11, "Gabriel Acosta", 285000, 285000, 0, "Al día"],
  [12, "Mariana Luna", 285000, 0, 297000, "Deudor"],
  [13, "Tomás Vega", 285000, 285000, 0, "Al día"],
  [14, "Agustina Paz", 285000, 285000, 0, "Al día"],
  [15, "Nicolás Cabrera", 285000, 285000, 0, "Al día"],
  [16, "Camila Ferreyra", 285000, 285000, 0, "Al día"],
  [17, "Federico Suárez", 285000, 0, 612000, "Deudor"],
  [18, "Julieta Méndez", 285000, 285000, 0, "Al día"],
  [19, "Lucas Ibarra", 285000, 285000, 0, "Al día"],
  [20, "Renata Aguirre", 285000, 285000, 0, "Al día"],
  [21, "Martín Ledesma", 285000, 285000, 0, "Al día"],
  [22, "Bautista Ortiz", 285000, 285000, 0, "Al día"],
  [23, "Delfina Castro", 285000, 150000, 420000, "Deudor"],
  [24, "Ignacio Rossi", 285000, 285000, 0, "Al día"],
  [25, "Pilar Domínguez", 285000, 285000, 0, "Al día"],
  [26, "Santiago Cruz", 285000, 285000, 0, "Al día"],
  [27, "Abril Navarro", 285000, 285000, 0, "Al día"],
  [28, "Joaquín Vera", 285000, 285000, 0, "Al día"],
  [29, "Catalina Ramos", 285000, 0, 285000, "Deudor"],
  [30, "Emiliano Silva", 285000, 285000, 0, "Al día"],
  [31, "Antonella Bravo", 285000, 285000, 0, "Al día"],
  [32, "Franco Medina", 285000, 285000, 0, "Al día"],
  [33, "Guadalupe León", 285000, 285000, 0, "Al día"],
  [34, "Matías Cáceres", 285000, 285000, 0, "Al día"],
  [35, "Rocío Figueroa", 285000, 285000, 0, "Al día"],
  [36, "Benjamín Flores", 285000, 285000, 0, "Al día"],
  [37, "Morena Ojeda", 285000, 0, 740000, "Deudor"],
  [38, "Thiago Cardozo", 285000, 285000, 0, "Al día"],
  [39, "Olivia Quiroga", 285000, 285000, 0, "Al día"],
  [40, "Simón Maldonado", 285000, 285000, 0, "Al día"],
  [41, "Isabella Peralta", 285000, 285000, 0, "Al día"],
  [43, "Ramiro Núñez", 285000, 285000, 0, "Al día"],
  [47, "Mía Villalba", 285000, 285000, 0, "Al día"],
  [52, "Dante Acuña", 570000, 570000, 0, "Al día"], // multi-lote owner
  [58, "Helena Sánchez", 285000, 0, 285000, "Deudor"],
];

export function demoVecinos(): VecinoData[] {
  const concepto = periodLabel();
  return VEC.map(([lote, propietario, cargo, pago, saldo, estado]) => ({
    id: `demo-vec-${lote}`,
    lote: String(lote),
    propietario,
    concepto,
    cuotas: null,
    cargo,
    pago,
    saldo,
    estado,
    mes_corriente: cargo,
    saldo_anterior: estado === "Deudor" ? Math.max(0, saldo - cargo) : 0,
    fecha_pago: estado === "Al día" && pago > 0 ? thisMonthDay(Math.min(8, 1 + (lote % 8))) : null,
    codigo: `LR-${String(lote).padStart(3, "0")}`,
    comprobante_url: null,
  }));
}

export function demoResidentVecino(): VecinoData {
  return demoVecinos().find((v) => v.lote === "7")!;
}

export function demoDeudores(): DeudorRow[] {
  return demoVecinos()
    .filter((v) => v.estado === "Deudor")
    .map((v) => ({
      id: v.id ?? "",
      lote: v.lote,
      propietario: v.propietario,
      concepto: v.concepto,
      cargo: v.cargo,
      saldo: v.saldo,
      estado: v.estado,
    }));
}

export function demoVecinoHistory(): VecinoHistoryEntry[] {
  // A few months of snapshots for the demo resident (lote 7).
  const d = getArgentinaDate();
  const out: VecinoHistoryEntry[] = [];
  for (let i = 1; i <= 4; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({
      id: `demo-hist-7-${i}`,
      lote: "7",
      propietario: DEMO_USER_NAME,
      concepto: `${capitalize(getArgentinaMonthName(m))} ${m.getFullYear()}`,
      cargo: 285000,
      pago: 285000,
      saldo: 0,
      estado: "Al día",
      fecha_pago: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-05`,
      comprobante_url: null,
      period_year: m.getFullYear(),
      period_month: m.getMonth() + 1,
      archived_at: new Date(d.getFullYear(), d.getMonth() - i + 1, 1).toISOString(),
    });
  }
  return out;
}

export function demoTotalPayments(): TotalPaymentsData {
  const total = demoVecinos().reduce((s, v) => s + v.pago, 0);
  const totalGastos = DEMO_EXPENSES.filter((e) => e.estado === "Pagado").reduce((s, e) => s + Number(e.saldo || 0), 0);
  const totalPendientes = DEMO_EXPENSES.filter((e) => e.estado === "Pendiente").reduce((s, e) => s + Number(e.saldo || 0), 0);
  return { total, totalGastos, totalPendientes };
}

// ── Expenses (egresos), current month ──────────────────────────────
export const DEMO_EXPENSES: ExpenseRow[] = [
  { id: "demo-exp-1", fecha: thisMonthDay(2), vencimiento: thisMonthDay(12), concepto: "Energía eléctrica espacios comunes", categoria: "Servicios", proveedor: "EDENOR", saldo: "412000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-2", fecha: thisMonthDay(3), vencimiento: thisMonthDay(15), concepto: "Mantenimiento de jardines", categoria: "Mantenimiento", proveedor: "Verde Vivo S.R.L.", saldo: "320000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-3", fecha: thisMonthDay(4), vencimiento: thisMonthDay(18), concepto: "Servicio de vigilancia 24hs", categoria: "Seguridad", proveedor: "Custodia Norte", saldo: "1850000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-4", fecha: thisMonthDay(5), vencimiento: thisMonthDay(20), concepto: "Reparación bomba de agua", categoria: "Mantenimiento", proveedor: "HidroService", saldo: "185000", comprobante: "button", factura: "", estado: "Pendiente" },
  { id: "demo-exp-5", fecha: thisMonthDay(6), vencimiento: thisMonthDay(22), concepto: "Insumos de limpieza", categoria: "Servicios", proveedor: "Distribuidora Sur", saldo: "96000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-6", fecha: thisMonthDay(7), vencimiento: thisMonthDay(25), concepto: "Honorarios administración", categoria: "Administración", proveedor: "Estudio Contable Robles", saldo: "240000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-7", fecha: thisMonthDay(8), vencimiento: thisMonthDay(26), concepto: "Pintura portón de acceso oeste", categoria: "Obras", proveedor: "ObraFina", saldo: "175000", comprobante: "button", factura: "", estado: "Pendiente" },
  { id: "demo-exp-8", fecha: thisMonthDay(9), vencimiento: thisMonthDay(28), concepto: "Internet y telefonía garita", categoria: "Servicios", proveedor: "Telecom", saldo: "68000", comprobante: "button", factura: "", estado: "Pagado" },
  { id: "demo-exp-9", fecha: thisMonthDay(10), vencimiento: thisMonthDay(28), concepto: "Repuestos luminarias LED", categoria: "Mantenimiento", proveedor: "ElectroMax", saldo: "142000", comprobante: "button", factura: "", estado: "Pendiente" },
  { id: "demo-exp-10", fecha: thisMonthDay(11), vencimiento: thisMonthDay(30), concepto: "Seguro integral del barrio", categoria: "Administración", proveedor: "La Segunda Seguros", saldo: "390000", comprobante: "button", factura: "", estado: "Pagado" },
];

// ── Profiles (usuarios table). [0] = demo user (administrador). ──────
export const DEMO_PROFILES: AdminProfile[] = [
  { id: DEMO_PROFILE_ID, user_id: DEMO_USER_ID, name: DEMO_USER_NAME, lot: "7", email: DEMO_USER_EMAIL, phone: "+54 9 11 5555-0007", role: "administrador" },
  { id: "demo-prof-2", user_id: "demo-u-2", name: "Lucía Fernández", lot: "1", email: "lucia.fernandez@example.com", phone: "+54 9 11 5555-0001", role: "vecino" },
  { id: "demo-prof-3", user_id: "demo-u-3", name: "Carla Benítez", lot: "8", email: "carla.benitez@example.com", phone: "+54 9 11 5555-0008", role: "cuentas" },
  { id: "demo-prof-4", user_id: "demo-u-4", name: "Gabriel Acosta", lot: "11", email: "gabriel.acosta@example.com", phone: "+54 9 11 5555-0011", role: "coordinacion" },
  { id: "demo-prof-5", user_id: "demo-u-5", name: "Tomás Vega", lot: "13", email: "tomas.vega@example.com", phone: "+54 9 11 5555-0013", role: "seguridad" },
  { id: "demo-prof-6", user_id: "demo-u-6", name: "Agustina Paz", lot: "14", email: "agustina.paz@example.com", phone: "+54 9 11 5555-0014", role: "mantenimiento" },
  { id: "demo-prof-7", user_id: "demo-u-7", name: "Martín Rivas", lot: "15", email: "martin.rivas@example.com", phone: "+54 9 11 5555-0015", role: "guardia" },
  { id: "demo-prof-8", user_id: "demo-u-8", name: "Julieta Méndez", lot: "18", email: "julieta.mendez@example.com", phone: "+54 9 11 5555-0018", role: "vecino" },
  { id: "demo-prof-9", user_id: "demo-u-9", name: "Lucas Ibarra", lot: "19", email: "lucas.ibarra@example.com", phone: "+54 9 11 5555-0019", role: "vecino" },
  { id: "demo-prof-10", user_id: "demo-u-10", name: "Renata Aguirre", lot: "20", email: "renata.aguirre@example.com", phone: "+54 9 11 5555-0020", role: "administracion" },
  { id: "demo-prof-11", user_id: "demo-u-11", name: "Santiago Cruz", lot: "26", email: "santiago.cruz@example.com", phone: "+54 9 11 5555-0026", role: "vecino" },
  { id: "demo-prof-12", user_id: "demo-u-12", name: "Pilar Domínguez", lot: "25", email: "pilar.dominguez@example.com", phone: "", role: "pendiente" },
];

// ── Consejo (info page) — fictional council. Drives the contact icons ─
export interface DemoConsejoMember {
  area: string;
  name: string;
  lot: string;
  phone: string;
}
export const DEMO_CONSEJO_MEMBERS: DemoConsejoMember[] = [
  { area: "Coordinación", name: "Gabriel Acosta", lot: "11", phone: "+54 9 11 5555-0011" },
  { area: "Coordinación", name: "Renata Aguirre", lot: "20", phone: "+54 9 11 5555-0020" },
  { area: "Mantenimiento", name: "Agustina Paz", lot: "14", phone: "+54 9 11 5555-0014" },
  { area: "Mantenimiento", name: "Franco Medina", lot: "32", phone: "+54 9 11 5555-0032" },
  { area: "Cuentas", name: "Carla Benítez", lot: "8", phone: "+54 9 11 5555-0008" },
  { area: "Cuentas", name: "Ignacio Rossi", lot: "24", phone: "+54 9 11 5555-0024" },
  { area: "Seguridad", name: "Tomás Vega", lot: "13", phone: "+54 9 11 5555-0013" },
  { area: "Seguridad", name: "Martín Rivas", lot: "15", phone: "+54 9 11 5555-0015" },
  { area: "Arquitectura", name: "Julieta Méndez", lot: "18", phone: "+54 9 11 5555-0018" },
  { area: "Urbanismo", name: "Lucas Ibarra", lot: "19", phone: "+54 9 11 5555-0019" },
];
export const DEMO_DELEGADOS = [
  { name: "Santiago Cruz", lot: "26", manzana: "A" },
  { name: "Pilar Domínguez", lot: "25", manzana: "B" },
  { name: "Emiliano Silva", lot: "30", manzana: "C" },
  { name: "Guadalupe León", lot: "33", manzana: "D" },
];
export function demoConsejoContacts(): ConsejoContactProfile[] {
  return DEMO_CONSEJO_MEMBERS.map((m) => ({ name: m.name, lot: m.lot, phone: m.phone }));
}
// Shape consumed by informacion-page-content.tsx (`administracion`).
export function demoAdministracion() {
  const byArea = (area: string): { name: string; lot: string }[] =>
    DEMO_CONSEJO_MEMBERS.filter((m) => m.area === area).map((m) => ({ name: m.name, lot: m.lot }));
  return {
    consejo: {
      coordinacion: byArea("Coordinación"),
      mantenimiento: byArea("Mantenimiento"),
      cuentas: byArea("Cuentas"),
      seguridad: byArea("Seguridad"),
      arquitectura: byArea("Arquitectura"),
      urbanismo: byArea("Urbanismo"),
    },
    delegados: DEMO_DELEGADOS.map((d) => ({ name: d.name, manzana: `Manzana ${d.manzana}`, lot: d.lot })),
  };
}

// ── Complaints (reclamos) ───────────────────────────────────────────
const COMPLAINTS_BASE = [
  { id: "demo-c-1", profile_id: DEMO_PROFILE_ID, name: DEMO_USER_NAME, lot: "7", title: "Luminaria quemada en calle interna", description: "La luz frente al lote 7 no enciende hace tres noches.", category: "Mantenimiento", complaint_type: "reclamo", daysAgo: 1 },
  { id: "demo-c-2", profile_id: "demo-prof-2", name: "Lucía Fernández", lot: "1", title: "Sugerencia: cestos de reciclaje", description: "Sería bueno sumar cestos para reciclar en el área común.", category: "Comunidad", complaint_type: "sugerencia", daysAgo: 2 },
  { id: "demo-c-3", profile_id: "demo-prof-9", name: "Lucas Ibarra", lot: "19", title: "Ruidos molestos fin de semana", description: "Música fuerte después de las 2 AM el sábado.", category: "Convivencia", complaint_type: "reclamo", daysAgo: 3 },
  { id: "demo-c-4", profile_id: "demo-prof-8", name: "Julieta Méndez", lot: "18", title: "Consulta por expensas", description: "¿Cómo se calcula el fondo de reserva este mes?", category: "Administración", complaint_type: "consulta", daysAgo: 4 },
  { id: "demo-c-5", profile_id: "demo-prof-11", name: "Santiago Cruz", lot: "26", title: "Bache en la entrada", description: "Hay un pozo en el ingreso que conviene reparar.", category: "Mantenimiento", complaint_type: "reclamo", daysAgo: 5 },
];
export function demoAdminComplaints(): AdminComplaint[] {
  return COMPLAINTS_BASE.map((c) => ({
    id: c.id,
    user_id: c.profile_id === DEMO_PROFILE_ID ? DEMO_USER_ID : `u-${c.id}`,
    profile_id: c.profile_id,
    title: c.title,
    description: c.description,
    category: c.category,
    complaint_type: c.complaint_type,
    admin_comment: null,
    status: "pending",
    created_at: isoDaysAgo(c.daysAgo),
    updated_at: isoDaysAgo(c.daysAgo),
    profiles: { name: c.name, lot: c.lot },
  }));
}
export function demoUserComplaints(): UserComplaint[] {
  return COMPLAINTS_BASE.filter((c) => c.profile_id === DEMO_PROFILE_ID).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    complaint_type: c.complaint_type,
    admin_comment: null,
    status: "pending",
    created_at: isoDaysAgo(c.daysAgo),
    updated_at: isoDaysAgo(c.daysAgo),
  }));
}

// ── Visits (visitas) ────────────────────────────────────────────────
const VISITS_BASE = [
  { id: "demo-v-1", profile_id: DEMO_PROFILE_ID, name: DEMO_USER_NAME, lot: "7", visitor_name: "Esteban Páez", visitor_dni: "32.456.789", inDays: 1, visit_time: "18:30", license_plate: "AB 123 CD", relationship: "Familiar" },
  { id: "demo-v-2", profile_id: DEMO_PROFILE_ID, name: DEMO_USER_NAME, lot: "7", visitor_name: "Flete El Rápido", visitor_dni: "—", inDays: 3, visit_time: "10:00", license_plate: "AE 884 LM", relationship: "Proveedor" },
  { id: "demo-v-3", profile_id: "demo-prof-2", name: "Lucía Fernández", lot: "1", visitor_name: "Marta Giménez", visitor_dni: "27.110.220", inDays: 2, visit_time: "16:00", license_plate: null, relationship: "Amistad" },
  { id: "demo-v-4", profile_id: "demo-prof-9", name: "Lucas Ibarra", lot: "19", visitor_name: "Servicio Técnico Frío", visitor_dni: "—", inDays: 4, visit_time: "09:30", license_plate: "AC 552 KP", relationship: "Proveedor" },
];
export function demoUserVisits(): UserVisit[] {
  return VISITS_BASE.filter((v) => v.profile_id === DEMO_PROFILE_ID).map((v) => ({
    id: v.id,
    visitor_name: v.visitor_name,
    visitor_dni: v.visitor_dni,
    visit_date: ymdFromNow(v.inDays),
    visit_time: v.visit_time,
    license_plate: v.license_plate,
    relationship: v.relationship,
    notes: null,
    guard_comment: null,
    status: "pending",
    created_at: isoDaysAgo(0),
    updated_at: isoDaysAgo(0),
  }));
}
export function demoAdminVisits(): Array<UserVisit & { profile_id: string; profiles: { name: string; lot: string } | null }> {
  return VISITS_BASE.map((v) => ({
    id: v.id,
    visitor_name: v.visitor_name,
    visitor_dni: v.visitor_dni,
    visit_date: ymdFromNow(v.inDays),
    visit_time: v.visit_time,
    license_plate: v.license_plate,
    relationship: v.relationship,
    notes: null,
    guard_comment: null,
    status: "pending",
    created_at: isoDaysAgo(0),
    updated_at: isoDaysAgo(0),
    profile_id: v.profile_id,
    profiles: { name: v.name, lot: v.lot },
  }));
}

// ── Reminders (recordatorios + novedades) ───────────────────────────
export function demoReminders(type?: "recordatorio" | "novedad"): Reminder[] {
  const all: Reminder[] = [
    { id: "demo-r-1", type: "recordatorio", title: "Corte de agua programado", content: "El jueves de 9 a 12 hs habrá corte por mantenimiento de la red.", image_url: null, created_at: isoDaysAgo(1), author_role: "coordinacion" },
    { id: "demo-r-2", type: "recordatorio", title: "Vencimiento de expensas", content: "Recordá que las expensas vencen el día 10. Pagá a término y evitá recargos.", image_url: null, created_at: isoDaysAgo(0), author_role: "cuentas" },
    { id: "demo-n-1", type: "novedad", title: "Nueva cámara en el acceso oeste", content: "Se instaló una cámara de alta definición en el portón oeste para reforzar la seguridad.", image_url: null, created_at: isoDaysAgo(2), author_role: "seguridad" },
    { id: "demo-n-2", type: "novedad", title: "Reunión de consejo — resumen", content: "Se aprobó el presupuesto de pintura del SUM y la compra de luminarias LED.", image_url: null, created_at: isoDaysAgo(5), author_role: "administrador" },
  ];
  return type ? all.filter((r) => r.type === type) : all;
}

// ── Notifications ───────────────────────────────────────────────────
export function demoNotifications(): NotificationData[] {
  return [
    { id: "demo-nt-1", type: "reclamo", title: "Reclamo actualizado", content: "", message: "Tu reclamo de luminaria fue recibido por mantenimiento.", related_id: "demo-c-1", is_read: false, created_at: isoDaysAgo(0) } as unknown as NotificationData,
    { id: "demo-nt-2", type: "visita", title: "Visita autorizada", message: "La visita de Esteban Páez fue registrada en la garita.", related_id: "demo-v-1", is_read: false, created_at: isoDaysAgo(0) },
    { id: "demo-nt-3", type: "novedad", title: "Nueva novedad publicada", message: "Se publicó: Nueva cámara en el acceso oeste.", related_id: "demo-n-1", is_read: true, created_at: isoDaysAgo(2) },
    { id: "demo-nt-4", type: "pago", title: "Pago acreditado", message: "Tu pago de expensas fue acreditado. ¡Gracias!", related_id: null, is_read: true, created_at: isoDaysAgo(4) },
  ];
}

// ── Calendar events (this month) ────────────────────────────────────
export function demoCalendarEvents(): CalendarEvent[] {
  const d = getArgentinaDate();
  const mk = (day: number, event: string): CalendarEvent => ({ id: `demo-ev-${day}`, date: day, month: d.getMonth() + 1, year: d.getFullYear(), event });
  return [
    mk(5, "Vencimiento de expensas"),
    mk(12, "Corte de agua programado (9–12 hs)"),
    mk(18, "Reunión de consejo (20 hs, SUM)"),
    mk(22, "Fumigación de espacios comunes"),
    mk(28, "Feria de emprendedores del barrio"),
  ];
}

// ── Ingresantes (seguridad) ─────────────────────────────────────────
export function demoIngresantes(): Ingresante[] {
  return [
    { id: "demo-in-1", lote: "7", nombre_apellido: "Esteban Páez", tipo: "Visita", horario: `${getArgentinaToday()} 18:30`, documentacion: "DNI 32.456.789" },
    { id: "demo-in-2", lote: "1", nombre_apellido: "Marta Giménez", tipo: "Visita", horario: `${getArgentinaToday()} 16:05`, documentacion: "DNI 27.110.220" },
    { id: "demo-in-3", lote: "19", nombre_apellido: "Servicio Técnico Frío", tipo: "Empleado", horario: `${getArgentinaToday()} 09:35`, documentacion: "Remito 00123" },
    { id: "demo-in-4", lote: "14", nombre_apellido: "Verde Vivo (jardinería)", tipo: "Empleado", horario: `${getArgentinaToday()} 08:10`, documentacion: "—" },
    { id: "demo-in-5", lote: "11", nombre_apellido: "Gabriel Acosta", tipo: "Propietario", horario: `${getArgentinaToday()} 07:50`, documentacion: "DNI 30.998.114" },
    { id: "demo-in-6", lote: "26", nombre_apellido: "Correo Andreani", tipo: "Empleado", horario: `${getArgentinaToday()} 11:20`, documentacion: "Paquete LR-26" },
  ];
}

// ── Guard shifts + current shift + recorridos ───────────────────────
const GUARDS = ["Martín Rivas", "Raúl Ferreyra", "Mónica Sandoval", "Hugo Barrios"];
export function demoGuardShifts(year?: number, month?: number): GuardShift[] {
  const d = getArgentinaDate();
  const y = year ?? d.getFullYear();
  const m = month ?? d.getMonth() + 1;
  const daysInMonth = new Date(y, m, 0).getDate();
  const out: GuardShift[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    out.push({ id: `demo-gs-${dateStr}-d`, guard_name: GUARDS[day % GUARDS.length], shift_date: dateStr, shift_time: "07:00", notes: null });
    out.push({ id: `demo-gs-${dateStr}-n`, guard_name: GUARDS[(day + 2) % GUARDS.length], shift_date: dateStr, shift_time: "19:00", notes: null });
  }
  return out;
}
export function demoCurrentShift(): CurrentShift {
  const d = getArgentinaDate();
  const hour = d.getHours();
  const dayGuard = GUARDS[d.getDate() % GUARDS.length];
  const nightGuard = GUARDS[(d.getDate() + 2) % GUARDS.length];
  const isDay = hour >= 7 && hour < 19;
  const next = isDay ? `${getArgentinaToday()}T19:00:00` : `${ymdFromNow(1)}T07:00:00`;
  return {
    guard_name: isDay ? dayGuard : nightGuard,
    next_shift_guard: isDay ? nightGuard : GUARDS[(d.getDate() + 1) % GUARDS.length],
    next_shift_time: next,
  };
}
export function demoRecorridos(): Recorrido[] {
  const today = getArgentinaToday();
  return [
    { id: "demo-rec-1", recorrido_time: "08:00", notes: "Perímetro completo sin novedad.", recorrido_date: today },
    { id: "demo-rec-2", recorrido_time: "14:00", notes: "Control de portones y SUM. Todo en orden.", recorrido_date: today },
    { id: "demo-rec-3", recorrido_time: "20:30", notes: "Recorrido nocturno. Luminarias OK salvo lote 7 (reportado).", recorrido_date: today },
  ];
}

// ── Consumo eléctrico ───────────────────────────────────────────────
export const DEMO_CONSUMO: ConsumoElectricoRow[] = [
  { id: "demo-ce-1", propietario: "Lucía Fernández", lote: "1", pilar: true, jabalina: true, termica: true, fecha_medicion: thisMonthDay(3), numero_medidor: "M-0001", lectura: 14820, lectura_anterior: 14510 },
  { id: "demo-ce-2", propietario: "Sofía Herrera", lote: "3", pilar: true, jabalina: true, termica: false, fecha_medicion: thisMonthDay(3), numero_medidor: "M-0003", lectura: 9210, lectura_anterior: 9050 },
  { id: "demo-ce-3", propietario: "Martín Gómez", lote: "7", pilar: true, jabalina: true, termica: true, fecha_medicion: thisMonthDay(3), numero_medidor: "M-0007", lectura: 17640, lectura_anterior: 17310 },
  { id: "demo-ce-4", propietario: "Carla Benítez", lote: "8", pilar: true, jabalina: false, termica: true, fecha_medicion: thisMonthDay(3), numero_medidor: "M-0008", lectura: 11230, lectura_anterior: 11020 },
  { id: "demo-ce-5", propietario: "Gabriel Acosta", lote: "11", pilar: true, jabalina: true, termica: true, fecha_medicion: thisMonthDay(4), numero_medidor: "M-0011", lectura: 20110, lectura_anterior: 19880 },
  { id: "demo-ce-6", propietario: "Tomás Vega", lote: "13", pilar: false, jabalina: false, termica: false, fecha_medicion: null, numero_medidor: null, lectura: null, lectura_anterior: null },
  { id: "demo-ce-7", propietario: "Agustina Paz", lote: "14", pilar: true, jabalina: true, termica: true, fecha_medicion: thisMonthDay(4), numero_medidor: "M-0014", lectura: 8730, lectura_anterior: 8600 },
  { id: "demo-ce-8", propietario: "Renata Aguirre", lote: "20", pilar: true, jabalina: true, termica: false, fecha_medicion: thisMonthDay(5), numero_medidor: "M-0020", lectura: 13340, lectura_anterior: 13110 },
];

// ── Votaciones / encuestas (enriched API shape) ─────────────────────
export function demoVotaciones() {
  return {
    votaciones: [
      { id: "demo-vo-1", title: "¿Aprobás la compra de luminarias LED para todo el barrio?", description: "Reemplazo gradual de la iluminación por tecnología LED de bajo consumo.", closed: false, created_at: isoDaysAgo(2), mine: false, can_delete: true, author_name: "Gabriel Acosta", author_role: "coordinacion", votes_si: 38, votes_no: 6, total: 44, my_choice: "si" as const },
      { id: "demo-vo-2", title: "¿Estás de acuerdo con extender el horario del SUM hasta las 24 hs?", description: "Propuesta para uso del salón de usos múltiples en eventos.", closed: false, created_at: isoDaysAgo(6), mine: false, can_delete: true, author_name: "Renata Aguirre", author_role: "administracion", votes_si: 21, votes_no: 19, total: 40, my_choice: null },
    ],
    can_vote: true,
    can_create: true,
  };
}

// ── Cuota details + payment prices ──────────────────────────────────
export const DEMO_CUOTA_DETAILS: CuotaDetailRow[] = [
  { id: "demo-cd-1", label: "Expensas ordinarias", amount: "$ 242.000", position: 0 },
  { id: "demo-cd-2", label: "Fondo de reserva", amount: "$ 28.000", position: 1 },
  { id: "demo-cd-3", label: "Obra portón oeste (cuota 3/12)", amount: "$ 13.000", position: 2 },
  { id: "demo-cd-4", label: "Intereses / otros", amount: "$ 2.000", position: 3 },
];
export const DEMO_PAYMENT_PRICES: PaymentPricesData = {
  anticipadoEfectivo: "$ 270.000",
  termino: "$ 285.000",
  recargo: "$ 300.000",
  vencido: "$ 320.000",
};

// ── Biblioteca / archivos (file links inert) ────────────────────────
export const DEMO_BIBLIOTECA: BibliotecaFile[] = [
  { document_type: "plano", filename: "Plano de los lotes (ejemplo).pdf", file_url: "", updated_at: isoDaysAgo(40) },
  { document_type: "reglamento", filename: "Reglamento interno (ejemplo).pdf", file_url: "", updated_at: isoDaysAgo(120) },
];
export const DEMO_ASAMBLEA: AsambleaFile[] = [];

// ── Profile detail (/api/profile) ───────────────────────────────────
export function demoProfileDetail() {
  return {
    profile: {
      id: DEMO_PROFILE_ID,
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
      lot: "7",
      role: "administrador",
      phone: "+54 9 11 5555-0007",
      created_at: "2025-01-15T12:00:00.000Z",
    },
    convivientes: [
      { id: "demo-conv-1", name: "Paula Gómez", relationship: "Cónyuge", created_at: isoDaysAgo(200) },
      { id: "demo-conv-2", name: "Tomás Gómez", relationship: "Hijo/a", created_at: isoDaysAgo(200) },
    ],
    vehiculos: [
      { id: "demo-veh-1", license_plate: "AB 123 CD", model: "Toyota Corolla", owner_relationship: "Titular", comprobante_url: null, created_at: isoDaysAgo(180) },
    ],
  };
}
