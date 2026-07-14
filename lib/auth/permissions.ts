/**
 * Centralized permissions for Barrio Demo.
 * Role group arrays and permission checks used by API routes and pages.
 */

// Roles that can VIEW the admin page
export const ADMIN_ROLES = ["administrador", "cuentas", "coordinacion", "mantenimiento", "administracion", "seguridad"];
// Roles that can edit ingresos and accept pagos
export const FINANCE_ROLES = ["administrador", "cuentas", "coordinacion"];
// Roles that can edit egresos
export const EGRESOS_ROLES = ["administrador", "coordinacion", "administracion"];
// Roles that can VIEW the seguridad page
export const SECURITY_ROLES = ["administrador", "coordinacion", "administracion", "seguridad", "guardia"];
// Roles that can edit in seguridad (ingresantes, vigilancia, etc.) - NOT calendario
export const SECURITY_EDIT_ROLES = ["administrador", "guardia"];
// Roles that can edit the guard shift calendario in seguridad
export const SECURITY_CALENDAR_ROLES = ["administrador", "seguridad"];
// Roles that can manage gestion de informacion (recordatorio, novedad, calendario events)
export const INFO_MANAGEMENT_ROLES = ["administrador", "cuentas", "coordinacion", "administracion"];
// Roles that can manage gestion de comunidad (solicitudes pendientes, etc.)
export const COMMUNITY_MANAGEMENT_ROLES = ["administrador", "coordinacion"];
// Roles that can manage reclamos
export const RECLAMOS_ROLES = ["administrador", "mantenimiento"];
// Roles that can edit the "Detalle del período" lines shown on every resident's
// estado-de-cuenta panel.
export const CUOTA_DETAILS_ROLES = ["administrador", "administracion", "coordinacion", "cuentas"];
// Roles that can delete a comunidad votacion they did not create. The
// creator can always delete their own post; these roles are the council
// override.
export const VOTACION_DELETE_ROLES = [
  "administrador",
  "administracion",
  "coordinacion",
  "coordinador",
];
// Roles that can manage user roles (approve/reject/delete).
// Restricted to `administrador` only — role assignment is the single highest-
// privilege action in the system (it can grant any role, including admin), so
// keep it behind one role. Coordinacion still has admin-page visibility via
// ADMIN_ROLES but cannot promote/demote users.
export const ROLE_MANAGEMENT_ROLES = ["administrador"];
// Roles that may read private staff notes on someone else's profile. The API
// still blocks users from reading notes attached to their own profile.
export const PROFILE_ADMIN_NOTES_VIEW_ROLES = [
  "administrador",
  "administracion",
  "coordinacion",
  "cuentas",
  "mantenimiento",
  "seguridad",
];

// Roles the master administrator can assign from the user-management UI.
export const ASSIGNABLE_ROLES = [
  "vecino",
  "cuentas",
  "coordinacion",
  "administracion",
  "seguridad",
  "guardia",
  "mantenimiento",
  "administrador",
];

const ROLE_LABELS: Record<string, string> = {
  administrador: "Administrador",
  coordinador: "Coordinador",
  coordinacion: "Coordinación",
  cuentas: "Cuentas",
  mantenimiento: "Mantenimiento",
  administracion: "Administración",
  seguridad: "Seguridad",
  guardia: "Guardia",
  vecino: "Vecino",
  pendiente: "Pendiente",
};

export const ASSIGNABLE_ROLE_OPTIONS = ASSIGNABLE_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role] || role,
}));

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role.trim().toLowerCase());
}

export function isFinanceRole(role: string | null | undefined): boolean {
  return !!role && FINANCE_ROLES.includes(role.trim().toLowerCase());
}

export function isSecurityRole(role: string | null | undefined): boolean {
  return !!role && SECURITY_ROLES.includes(role.trim().toLowerCase());
}

export function isRoleManagementRole(role: string | null | undefined): boolean {
  return !!role && ROLE_MANAGEMENT_ROLES.includes(role.trim().toLowerCase());
}

export function canViewProfileAdminNotes(role: string | null | undefined): boolean {
  return !!role && PROFILE_ADMIN_NOTES_VIEW_ROLES.includes(role.trim().toLowerCase());
}

export function canDeleteVotacionByRole(role: string | null | undefined): boolean {
  return !!role && VOTACION_DELETE_ROLES.includes(role.trim().toLowerCase());
}

/**
 * Render a profiles.role value with proper Spanish capitalization/accents
 * for end-user display (e.g. "De parte de Administración").
 */
export function roleDisplayName(role: string | null | undefined): string {
  if (!role) return "Administración";
  const normalized = role.trim().toLowerCase();
  if (!normalized) return "Administración";
  return ROLE_LABELS[normalized] || (
    normalized
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^./, (char) => char.toLocaleUpperCase("es-AR"))
  );
}

export function canAccessResidentArea(role: string | null | undefined): boolean {
  const normalized = role?.trim().toLowerCase();
  return !!normalized && normalized !== "pendiente" && normalized !== "pending";
}

export function canAccessAdminArea(role: string | null | undefined): boolean {
  return isAdminRole(role);
}
