// Tour definitions for the website onboarding/tutorial.
//
// Each step targets an element marked with `data-tour-id="<target>"`. `route` is
// the pathname the step lives on. Steps come in three flavours:
//   - normal:  highlight a target, advance with the › button.
//   - tap:     highlight a real, tappable element (the notificaciones bell, the
//              profile avatar, a nav button). The user taps it themselves to open
//              the surface / change page and advance — nothing opens automatically.
//
// `context` marks a step whose content lives inside the profile modal or the
// notificaciones panel, so the provider can CLOSE that surface when the tour
// moves on. Opening is always user-driven (a tap step).
//
// `access` gates a step (or a whole page tour) by the viewer's AdminVisibility.
// A gated-out step is REMOVED from the active step list (the provider filters it)
// so the n/total counter and prev/next stay correct, and tours never point at a
// section the role can't see. "Recorrido completo" is composed dynamically from
// the page units the viewer can reach, so it self-truncates at their last page.
//
// Copy is intentionally in plain, friendly Spanish (layman terms).

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Wallet,
  BookOpen,
  Users,
  Compass,
  ShieldCheck,
  ClipboardList,
  Coins,
} from "lucide-react";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";

export type TourId =
  | "mi-panel"
  | "informacion"
  | "barrio"
  | "comunidad"
  | "seguridad"
  | "consejo-gestion"
  | "consejo-caja"
  | "completo";
export type TourContext = "profile" | "notifications";

export type AccessFn = (v: AdminVisibility | null) => boolean;

export interface TourStep {
  route: string;
  title: string;
  body: string;
  target?: string;
  context?: TourContext;
  tap?: boolean;
  tapHint?: string;
  access?: AccessFn;
}

export interface TourMeta {
  id: TourId;
  label: string;
  blurb: string;
  icon: LucideIcon;
  access?: AccessFn;
}

const R_PANEL = "/dashboard";
const R_INFO = "/dashboard/informacion";
const R_BARRIO = "/informacion";
const R_COMUNIDAD = "/comunidad";
const R_SEGURIDAD = "/seguridad";
const R_GESTION = "/admin/gestion";
const R_CAJA = "/admin/ingresos";

// ── Access predicates (mirror the server-side gating; see admin-visibility.ts) ──
const canSeeSeguridad: AccessFn = (v) => !!v?.canSeeSecurityArchive;
const canSeeGestion: AccessFn = (v) => !!v && v.isAdmin && v.canSeeGestion;
// The Caja page (/admin/ingresos) redirects unless the role can see finance or egresos.
const canSeeCaja: AccessFn = (v) => !!(v?.canSeeFinance || v?.canSeeEgresos);

const miPanelSteps: TourStep[] = [
  {
    target: "estado-cuenta",
    route: R_PANEL,
    title: "Estado de cuenta",
    body: 'Acá ves cuánto te toca pagar este mes y si estás al día. Con el botón "Informar pago" le avisás a la administración que ya pagaste, en efectivo o por transferencia.',
  },
  {
    target: "recordatorios",
    route: R_PANEL,
    title: "Recordatorios",
    body: 'Los avisos importantes de la administración aparecen acá. Tocá "Ver todas" para leer todos los recordatorios.',
  },
  {
    target: "activo-comunidad",
    route: R_PANEL,
    title: "Activo en comunidad",
    body: "Si hay una votación abierta, podés votar Sí o No directamente desde acá. Tu opinión ayuda a tomar las decisiones del barrio.",
  },
  {
    target: "cuenta-corriente",
    route: R_PANEL,
    title: "Cuenta corriente",
    body: "Tu historial de cuotas mes a mes. Podés ver tus comprobantes, subir el de este mes y revisar tu saldo.",
  },
  {
    target: "mi-gestion",
    route: R_PANEL,
    title: "Mi gestión",
    body: "Desde acá autorizás visitas para que la guardia las espere, y enviás reclamos o sugerencias a la administración. Abajo seguís el estado de cada gestión.",
  },
  {
    target: "top-deudores",
    route: R_PANEL,
    title: "Top deudores",
    body: "Un resumen de los lotes con mayor saldo pendiente. Es información general del barrio.",
  },
  {
    target: "notificaciones-bell",
    route: R_PANEL,
    tap: true,
    tapHint: "Tocá la campanita, arriba a la derecha, para abrir tus notificaciones.",
    title: "Notificaciones",
    body: "Esta campanita te avisa de novedades: pagos aprobados, respuestas a tus reclamos y más. El número rojo indica cuántas no leíste.",
  },
  {
    target: "notificaciones-panel",
    route: R_PANEL,
    context: "notifications",
    title: "Tus notificaciones",
    body: "Acá se abren todas tus notificaciones. Podés marcarlas como leídas o borrarlas, y desde el celular activar los avisos push.",
  },
  {
    target: "perfil-button",
    route: R_PANEL,
    tap: true,
    tapHint: "Tocá tu perfil, arriba a la derecha, para abrirlo.",
    title: "Tu perfil",
    body: "Acá entrás a tu perfil: tus datos, tus vehículos y las acciones de tu cuenta.",
  },
  {
    target: "perfil-datos",
    route: R_PANEL,
    context: "profile",
    title: "Tus datos",
    body: 'Acá están tus datos de contacto. Con "Editar datos" podés actualizar tu teléfono, tu email y tus convivientes.',
  },
  {
    target: "perfil-vehiculos",
    route: R_PANEL,
    context: "profile",
    title: "Vehículos registrados",
    body: 'Tus autos registrados para ingresar al barrio. En "Ver seguro" abrís el comprobante de seguro cargado para cada vehículo.',
  },
  {
    target: "perfil-acciones",
    route: R_PANEL,
    context: "profile",
    title: "Acciones de tu perfil",
    body: "Desde acá restablecés tu contraseña, cerrás sesión y volvés a abrir este Tutorial cuando quieras.",
  },
];

const informacionSteps: TourStep[] = [
  {
    target: "info-egresos",
    route: R_INFO,
    title: "Egresos del barrio",
    body: "El detalle de los gastos del barrio este mes: en qué se usa la plata de las cuotas. Podés ver cada comprobante y factura.",
  },
  {
    target: "info-gastos-rubro",
    route: R_INFO,
    title: "Gastos por rubro",
    body: "Los mismos gastos, pero agrupados por categoría, para ver de un vistazo a dónde va la mayor parte.",
  },
  {
    target: "info-ingresos",
    route: R_INFO,
    title: "Ingresos y deudores",
    body: "Quiénes están al día y quiénes tienen saldo pendiente. Es información de transparencia del barrio.",
  },
  {
    target: "info-top-deudores",
    route: R_INFO,
    title: "Top deudores",
    body: "El ranking de los lotes con mayor deuda acumulada.",
  },
];

const barrioSteps: TourStep[] = [
  {
    target: "barrio-biblioteca",
    route: R_BARRIO,
    title: "Biblioteca digital",
    body: "Documentos oficiales del barrio: el plano de los lotes, el reglamento y las actas de asamblea. Tocá cualquiera para abrirlo.",
  },
  {
    target: "barrio-faq",
    route: R_BARRIO,
    title: "Preguntas frecuentes",
    body: "Respuestas a las dudas más comunes: horarios, el sistema de pago, normas de convivencia y más.",
  },
  {
    target: "barrio-consejo",
    route: R_BARRIO,
    title: "Consejo",
    body: "Conocé a las personas que gestionan el barrio y a tu delegado de manzana, con su contacto.",
  },
];

const comunidadSteps: TourStep[] = [
  {
    target: "comunidad-votaciones",
    route: R_COMUNIDAD,
    title: "Votaciones",
    body: "Las decisiones del barrio se votan acá. Podés ver las votaciones abiertas, votar y seguir los resultados.",
  },
  {
    target: "comunidad-novedades",
    route: R_COMUNIDAD,
    title: "Novedades",
    body: "Las últimas novedades y comunicados de la administración.",
  },
  {
    target: "comunidad-calendario",
    route: R_COMUNIDAD,
    title: "Calendario",
    body: "Las fechas clave del barrio: vencimientos, asambleas y eventos. Tocá un día para ver el detalle.",
  },
];

// ── Seguridad (panel operativo). All sections visible to security roles. ──
const seguridadSteps: TourStep[] = [
  {
    target: "seg-turno",
    route: R_SEGURIDAD,
    title: "Turno actual",
    body: "Arriba ves quién está de guardia ahora y su teléfono (tocá para llamar), además del próximo turno con su horario. Se actualiza solo.",
  },
  {
    target: "seg-ingresantes",
    route: R_SEGURIDAD,
    title: "Ingresantes",
    body: 'El registro de quienes entran al barrio. Tocá "Añadir" para cargar uno nuevo, el lápiz para editar la tabla y "Guardar" al terminar. Con "Descargar" generás un PDF del registro.',
  },
  {
    target: "seg-vigilancia",
    route: R_SEGURIDAD,
    title: "Vigilancia",
    body: "El parte de recorridos. Elegí el horario del recorrido y escribí las novedades (se guardan solas). Al cerrar el día, todos los recorridos se guardan en un PDF que va a Archivos y la lista queda limpia para la jornada siguiente.",
  },
  {
    target: "seg-visitas",
    route: R_SEGURIDAD,
    title: "Visitas",
    body: 'Las visitas que los vecinos autorizan. Tocá una para ver los datos del visitante y confirmá con "Autorizar visita" cuando llega.',
  },
  {
    target: "seg-calendario",
    route: R_SEGURIDAD,
    title: "Calendario de turnos",
    body: "La grilla de turnos de la guardia. Tocá el día que quieras para agregar o quitar los turnos de esa fecha (nombre del guardia y horario).",
  },
];

// ── Consejo · Gestión. Steps gated per-section to match the page's visibility. ──
const gestionSteps: TourStep[] = [
  {
    target: "gestion-reclamos",
    route: R_GESTION,
    access: (v) => !!v?.canSeeReclamosFeed,
    title: "Consultas, sugerencias y reclamos",
    body: 'Lo que envían los vecinos llega acá. Usá las pestañas para filtrar y "marcar como leído" (podés responder con un comentario).',
  },
  {
    target: "gestion-recordatorios",
    route: R_GESTION,
    access: (v) => !!v?.canSeeInfo,
    title: "Recordatorios y novedades",
    body: "Desde acá publicás un recordatorio o una novedad. Lo que publiques lo ven todos los vecinos en sus páginas de Barrio y Comunidad.",
  },
  {
    target: "gestion-calendario",
    route: R_GESTION,
    access: (v) => !!v && v.canSeeInfo && v.canEditInfo,
    title: "Calendario",
    body: "Cargá un evento con fecha, hora y título. Aparece en el calendario público del Barrio que ven todos los vecinos.",
  },
  {
    target: "gestion-biblioteca",
    route: R_GESTION,
    access: (v) => !!v?.canSeeInfo,
    title: "Biblioteca digital",
    body: "Acá actualizás el plano, el reglamento y las actas. El documento que subas reemplaza al que ven los vecinos en la Biblioteca del Barrio.",
  },
  {
    target: "gestion-usuarios",
    route: R_GESTION,
    access: (v) => !!v?.canSeeUsuarios,
    title: "Usuarios",
    body: "El listado de todos los usuarios. Buscá y tocá una fila para abrir el perfil de la persona y ver sus datos y el seguro de cada vehículo registrado.",
  },
  {
    target: "gestion-archivo",
    route: R_GESTION,
    access: (v) =>
      !!v &&
      (v.canSeeFinanceArchive || v.canSeeReclamosFeed || v.canSeeSecurityArchive),
    title: "Archivo",
    body: "Todo lo que se va guardando en PDF: ingresos, egresos, recorridos, visitas y más. Tocá una sección para abrir su historial.",
  },
];

// ── Consejo · Caja. Finance sections gated by canSeeFinance; egresos by canSeeEgresos. ──
const cajaSteps: TourStep[] = [
  {
    target: "caja-admin-financiera",
    route: R_CAJA,
    access: (v) => !!v?.canSeeFinance,
    title: "Administración financiera",
    body: "Acá definís el valor de la cuota según la fecha de pago: anticipado, en término o vencido. Tocá el lápiz para editar un monto.",
  },
  {
    target: "caja-ingresos",
    route: R_CAJA,
    access: (v) => !!v?.canSeeFinance,
    title: "Ingresos",
    body: 'La tabla de cuotas de cada lote. Con "Descargar" guardás un PDF de lo que estás viendo en Archivos, el filtro elige mes y año, y el lápiz te deja editar una fila.',
  },
  {
    target: "caja-pagos-pendientes",
    route: R_CAJA,
    access: (v) => !!v?.canEditFinance,
    title: "Pagos pendientes",
    body: "Acá revisás los pagos que informan los vecinos y los aprobás o rechazás. Al aprobar, se acredita automáticamente en su cuenta.",
  },
  {
    target: "caja-resumen",
    route: R_CAJA,
    access: (v) => !!v?.canSeeFinance,
    title: "Resumen financiero",
    body: "El estado de la caja de un vistazo: lo cobrado, lo que falta cobrar y la deuda acumulada.",
  },
  {
    target: "caja-egresos",
    route: R_CAJA,
    access: (v) => !!v?.canSeeEgresos,
    title: "Egresos",
    body: 'Los gastos del barrio. Tenés el mismo "Descargar" (PDF a Archivos) y filtro de mes y año, y podés agregar o editar cada gasto.',
  },
  {
    target: "caja-graficos",
    route: R_CAJA,
    access: (v) => !!v?.canSeeFinance,
    title: "Gráficos",
    body: "Los ingresos y egresos representados en gráficos para leer las proporciones de un vistazo.",
  },
  {
    target: "caja-consumo",
    route: R_CAJA,
    access: (v) => !!v?.canSeeConsumo,
    title: "Consumo eléctrico",
    body: 'El registro de medidores y consumo por lote, con su "Descargar" y filtro de mes y año.',
  },
  {
    target: "caja-mapa",
    route: R_CAJA,
    access: (v) => !!v?.canSeeFinance,
    title: "Mapa del barrio",
    body: "El plano de lotes pintado según el estado de pago: al día o con deuda. Pasá por encima de un lote para ver el detalle.",
  },
];

// Page-transition step used by "Recorrido completo": the card appears on the page
// the user is currently on (`route`) and highlights the real nav button (`target`)
// they should tap to reach the next page. The next step owns the destination route.
function navTapStep(
  route: string,
  target: string,
  title: string,
  body: string,
  tapHint: string
): TourStep {
  return { route, target, tap: true, tapHint, title, body };
}

// A page unit = one page's steps + how to navigate INTO it from the previous page
// + who can reach it. "Recorrido completo" stitches the accessible units together.
interface TourUnit {
  id: Exclude<TourId, "completo">;
  route: string;
  steps: TourStep[];
  access: AccessFn;
  // nav metadata — how to enter this unit from the previous one (undefined for the first).
  nav?: { target: string; title: string; body: string; hint: string };
}

const UNITS: TourUnit[] = [
  { id: "mi-panel", route: R_PANEL, steps: miPanelSteps, access: () => true },
  {
    id: "informacion",
    route: R_INFO,
    steps: informacionSteps,
    access: () => true,
    nav: {
      target: "nav-dashboard-informacion",
      title: "Abrí Información",
      body: "Terminamos con Mi Panel. Sigamos con la información económica del barrio.",
      hint: "Tocá el botón Información para cambiar de sección.",
    },
  },
  {
    id: "barrio",
    route: R_BARRIO,
    steps: barrioSteps,
    access: () => true,
    nav: {
      target: "nav-barrio",
      title: "Abrí Barrio",
      body: "Ahora veamos los documentos, las preguntas frecuentes y el consejo.",
      hint: "Tocá el botón Barrio para cambiar de sección.",
    },
  },
  {
    id: "comunidad",
    route: R_COMUNIDAD,
    steps: comunidadSteps,
    access: () => true,
    nav: {
      target: "nav-comunidad",
      title: "Abrí Comunidad",
      body: "Por último para los vecinos: las votaciones, novedades y el calendario.",
      hint: "Tocá el botón Comunidad para cambiar de sección.",
    },
  },
  {
    id: "seguridad",
    route: R_SEGURIDAD,
    steps: seguridadSteps,
    access: canSeeSeguridad,
    nav: {
      target: "nav-seguridad",
      title: "Abrí Seguridad",
      body: "Pasemos al panel operativo de la guardia.",
      hint: "Tocá Seguridad (el escudo) en el menú.",
    },
  },
  {
    id: "consejo-gestion",
    route: R_GESTION,
    steps: gestionSteps,
    access: canSeeGestion,
    nav: {
      target: "nav-consejo",
      title: "Abrí el Consejo",
      body: "Entramos al panel de control del consejo: empecemos por Gestión.",
      hint: "Tocá Consejo en el menú.",
    },
  },
  {
    id: "consejo-caja",
    route: R_CAJA,
    steps: cajaSteps,
    access: canSeeCaja,
    nav: {
      target: "nav-caja",
      title: "Abrí Caja",
      body: "Por último, la caja: ingresos, egresos y finanzas del barrio.",
      hint: "Tocá Caja en el menú del Consejo.",
    },
  },
];

function visibleSteps(steps: TourStep[], v: AdminVisibility | null): TourStep[] {
  return steps.filter((s) => !s.access || s.access(v));
}

// Build the active step list for a tour, gated by the viewer's visibility.
// Single-page tours → that unit's visible steps. "Recorrido completo" → the
// accessible units in order, each preceded by a nav tap-step (whose source route
// is the previous included unit, so skipped pages never break the chain).
export function buildTour(id: TourId, v: AdminVisibility | null): TourStep[] {
  if (id === "completo") {
    const accessible = UNITS.filter((u) => u.access(v));
    const out: TourStep[] = [];
    accessible.forEach((unit, i) => {
      if (i > 0 && unit.nav) {
        const from = accessible[i - 1].route;
        out.push(
          navTapStep(from, unit.nav.target, unit.nav.title, unit.nav.body, unit.nav.hint)
        );
      }
      out.push(...visibleSteps(unit.steps, v));
    });
    return out;
  }
  const unit = UNITS.find((u) => u.id === id);
  return unit ? visibleSteps(unit.steps, v) : [];
}

export const TOUR_REGISTRY: TourMeta[] = [
  {
    id: "mi-panel",
    label: "Mi panel",
    blurb: "Tu inicio: pagos, recordatorios, gestiones y perfil.",
    icon: LayoutDashboard,
  },
  {
    id: "informacion",
    label: "Información",
    blurb: "La información económica del barrio.",
    icon: Wallet,
  },
  {
    id: "barrio",
    label: "Barrio",
    blurb: "Documentos, preguntas frecuentes y consejo.",
    icon: BookOpen,
  },
  {
    id: "comunidad",
    label: "Comunidad",
    blurb: "Votaciones, novedades y calendario.",
    icon: Users,
  },
  {
    id: "seguridad",
    label: "Seguridad",
    blurb: "El panel operativo de la guardia.",
    icon: ShieldCheck,
    access: canSeeSeguridad,
  },
  {
    id: "consejo-gestion",
    label: "Consejo · Gestión",
    blurb: "Comunidad, información y usuarios del barrio.",
    icon: ClipboardList,
    access: canSeeGestion,
  },
  {
    id: "consejo-caja",
    label: "Consejo · Caja",
    blurb: "Ingresos, egresos y finanzas.",
    icon: Coins,
    access: canSeeCaja,
  },
  {
    id: "completo",
    label: "Recorrido completo",
    blurb: "Un recorrido por todo lo que podés ver, de principio a fin.",
    icon: Compass,
  },
];
