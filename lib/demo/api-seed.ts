// ── Demo API responses (client widgets) ─────────────────────────────
//
// Browser-safe response bodies for client widgets that still use the product's
// API-shaped interfaces. No request leaves the static application.
import { getArgentinaDate } from "@/lib/utils/argentina-date";
import {
  demoVecinos,
  demoResidentVecino,
  demoVecinoHistory,
  demoAdminComplaints,
  demoUserComplaints,
  demoAdminVisits,
  demoUserVisits,
  demoNotifications,
  demoReminders,
  demoIngresantes,
  demoRecorridos,
  demoGuardShifts,
  demoCurrentShift,
  demoCalendarEvents,
  demoVotaciones,
  demoProfileDetail,
  DEMO_EXPENSES,
  DEMO_PROFILES,
  DEMO_CONSUMO,
  DEMO_CUOTA_DETAILS,
  DEMO_PAYMENT_PRICES,
  DEMO_PAYMENT_REQUESTS,
  DEMO_BIBLIOTECA,
  DEMO_ASAMBLEA,
} from "./seed";
import { permissionCatalog } from "@/lib/auth/permission-registry";

const DEMO_ROLES = [
  { slug: "administrador", label: "Administrador", is_system: true, is_assignable: true },
  { slug: "coordinacion", label: "Coordinación", is_system: true, is_assignable: true },
  { slug: "cuentas", label: "Cuentas", is_system: true, is_assignable: true },
  { slug: "administracion", label: "Administración", is_system: true, is_assignable: true },
  { slug: "seguridad", label: "Seguridad", is_system: true, is_assignable: true },
  { slug: "guardia", label: "Guardia", is_system: true, is_assignable: true },
  { slug: "mantenimiento", label: "Mantenimiento", is_system: true, is_assignable: true },
  { slug: "egresos", label: "Egresos", is_system: false, is_assignable: true },
  { slug: "vecino", label: "Vecino", is_system: true, is_assignable: true },
  { slug: "pendiente", label: "Pendiente", is_system: true, is_assignable: false },
];

function demoRolePermissionKeys(pathname: string): string[] | null {
  const match = pathname.match(/^\/api\/admin\/roles\/([^/]+)\/permissions$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]).toLowerCase();
  if (slug === "administrador") return permissionCatalog.map((permission) => permission.key);
  if (slug === "egresos") return ["panel.access", "egresos.view", "egresos.create"];
  if (slug === "vecino") {
    return [
      "notifications.receive.price_change",
      "notifications.receive.new_invoice",
      "notifications.receive.new_recordatorio",
      "notifications.receive.new_novedad",
      "notifications.receive.new_calendar_event",
      "notifications.receive.payment_approved",
      "notifications.receive.payment_rejected",
      "notifications.receive.reclamo_status_change",
      "notifications.receive.visita_status_change",
    ];
  }
  return permissionCatalog
    .filter((permission) => permission.key.startsWith("notifications.receive."))
    .map((permission) => permission.key);
}

function emptyFiles() {
  return { files: [] };
}

function demoCurrentPayment() {
  const day = getArgentinaDate().getDate();
  if (day <= 5) return { type: "PAGO ANTICIPADO", amount: DEMO_PAYMENT_PRICES.anticipadoEfectivo, description: "Hasta el 5" };
  if (day <= 10) return { type: "PAGO A TÉRMINO", amount: DEMO_PAYMENT_PRICES.termino, description: "Del 6 al 10" };
  return { type: "PAGO CON RECARGO", amount: DEMO_PAYMENT_PRICES.recargo, description: "Del 11 a fin de mes" };
}

// Map of GET path → response body (in the route's wrapper shape).
export function demoGetBody(pathname: string, searchParams: URLSearchParams): Record<string, unknown> | null {
  const roleKeys = demoRolePermissionKeys(pathname);
  if (roleKeys) return { keys: roleKeys };

  switch (pathname) {
    case "/api/vecinos":
      return {
        data: demoVecinos().map((v) => ({
          id: v.id,
          lote: v.lote,
          propietario: v.propietario,
          concepto: v.concepto,
          cuotas: v.cuotas,
          cargo: v.cargo,
          pago: v.pago,
          saldo: v.saldo,
          estado: v.cargo === 0 && v.pago === 0 ? "-" : v.saldo > 0 ? "Deudor" : "Al día",
          fecha_pago: v.fecha_pago,
          codigo: v.codigo,
        })),
      };
    case "/api/expenses":
      return { expenses: DEMO_EXPENSES.map((e) => ({ ...e, created_at: e.fecha })) };
    case "/api/expenses/proveedores":
      return { presets: [] };
    case "/api/expenses/conceptos":
      return { presets: [] };
    case "/api/resident/vecino":
      return { vecino: demoResidentVecino(), history: demoVecinoHistory() };
    case "/api/payments":
      return { currentPayment: demoCurrentPayment(), allPrices: DEMO_PAYMENT_PRICES };
    case "/api/payments/pending":
      return { paymentRequests: [] };
    case "/api/payments/my-requests":
      return { requests: DEMO_PAYMENT_REQUESTS, hasPendingPayment: false };
    case "/api/admin/profiles":
      return { profiles: DEMO_PROFILES };
    case "/api/admin/pending-users":
      return { users: DEMO_PROFILES.filter((profile) => profile.role === "pendiente") };
    case "/api/admin/users-count":
      return { count: DEMO_PROFILES.length };
    case "/api/admin/roles":
      return {
        roles: DEMO_ROLES,
        permissions: permissionCatalog.map((permission) => ({ ...permission })),
      };
    case "/api/admin/user-profile": {
      const detail = demoProfileDetail();
      return {
        ...detail,
        notes: "Notas administrativas ficticias para recorrer la experiencia.",
        can_view_notes: true,
        can_edit_notes: true,
      };
    }
    case "/api/admin/vecinos-owner-suggestions": {
      const query = searchParams.get("lote")?.trim();
      const suggestions = demoVecinos()
        .filter((vecino) => !query || vecino.lote.includes(query))
        .slice(0, 5)
        .map((vecino) => ({
          propietario: vecino.propietario,
          lote: vecino.lote,
          count: 1,
        }));
      return { suggestions };
    }
    case "/api/admin/complaints":
      return { complaints: demoAdminComplaints() };
    case "/api/admin/visits":
      return { visits: demoAdminVisits() };
    case "/api/notifications":
      return { notifications: demoNotifications() };
    case "/api/reminders": {
      const type = searchParams.get("type");
      const t = type === "recordatorio" || type === "novedad" ? type : undefined;
      return { reminders: demoReminders(t) };
    }
    case "/api/seguridad/ingresantes":
      return { ingresantes: demoIngresantes() };
    case "/api/seguridad/recorridos":
      return { recorridos: demoRecorridos() };
    case "/api/seguridad/shifts": {
      const year = Number(searchParams.get("year")) || undefined;
      const month = Number(searchParams.get("month")) || undefined;
      return { shifts: demoGuardShifts(year, month) };
    }
    case "/api/seguridad/current-shift":
      return { shift: demoCurrentShift() };
    case "/api/consumo-electrico":
      return { rows: DEMO_CONSUMO };
    case "/api/votaciones":
      return demoVotaciones();
    case "/api/profile":
      return demoProfileDetail();
    case "/api/visits/user":
      return { visits: demoUserVisits() };
    case "/api/complaints/user":
      return { complaints: demoUserComplaints() };
    case "/api/calendar-events":
      return { events: demoCalendarEvents() };
    case "/api/cuota-details":
      return { details: DEMO_CUOTA_DETAILS };
    case "/api/resident/generate-code":
      return { codigo: "LR-007" };
    case "/api/auth/role":
      return { role: "administrador", isAdmin: true };
    case "/api/biblioteca-digital/files":
    case "/api/biblioteca-digital/public":
      return { files: DEMO_BIBLIOTECA };
    case "/api/biblioteca-digital/asamblea/files":
      return { files: DEMO_ASAMBLEA };
    case "/api/archivo/estado-cuenta":
    case "/api/archivo/egresos-files":
    case "/api/archivo/consumo-electrico-files":
    case "/api/seguridad/ingresantes/files":
    case "/api/seguridad/recorridos/files":
      return emptyFiles();
    case "/api/archivo/reclamos":
      return { complaints: demoAdminComplaints().filter((complaint) => complaint.status === "read") };
    case "/api/seguridad/visits-archive":
      return { visits: [] };
    case "/api/push-subscription":
      return { subscribed: false };
    default:
      return null;
  }
}
