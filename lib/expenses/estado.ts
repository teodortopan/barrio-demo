export type EffectiveEstado = "Pagado" | "Vencido" | "Pendiente";

// Derive the effective estado for an expense, treating anything past its
// vencimiento date as "Vencido" even if the DB still says "Pendiente".
// Dates are compared at 00:00 Argentina time.
export function computeEstado(estado: string, vencimiento: string): EffectiveEstado {
  if (estado === "Pagado") return "Pagado";
  if (!vencimiento) return (estado as EffectiveEstado) || "Pendiente";
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  today.setHours(0, 0, 0, 0);
  const venc = new Date(vencimiento + "T00:00:00");
  if (!isNaN(venc.getTime()) && today > venc) return "Vencido";
  return (estado as EffectiveEstado) || "Pendiente";
}
