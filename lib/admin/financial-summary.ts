interface VecinoSummaryRow {
  cargo?: number | null;
  pago?: number | null;
  saldo?: number | null;
}

interface ExpenseSummaryRow {
  fecha?: string | null;
  saldo: string;
  estado: string;
}

export interface FinancialSummary {
  proyectado: number;
  cobrado: number;
  porCobrar: number;
  deuda: number;
  posicionCaja: number;
  gastosProyectados: number;
  pasivos: number;
}

export function buildFinancialSummary(
  vecinos: VecinoSummaryRow[],
  expenses: ExpenseSummaryRow[]
): FinancialSummary {
  const proyectado = vecinos.reduce((sum, v) => sum + (v.cargo || 0), 0);
  const cobrado = vecinos.reduce((sum, v) => sum + (v.pago || 0), 0);
  const porCobrar = proyectado - cobrado;
  const deuda = vecinos.reduce((sum, v) => sum + (v.saldo || 0), 0);

  const argNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const currentMonth = argNow.getMonth() + 1;
  const currentYear = argNow.getFullYear();
  const currentMonthExpenses = expenses.filter((e) => {
    const m = e.fecha?.match(/^(\d{4})-(\d{2})/);
    if (!m) return false;
    return parseInt(m[1]) === currentYear && parseInt(m[2]) === currentMonth;
  });

  const egresosTotal = currentMonthExpenses.reduce((sum, e) => sum + parseArgentineCurrency(e.saldo), 0);
  const posicionCaja = cobrado - egresosTotal;
  const gastosProyectados = currentMonthExpenses
    .filter((e) => e.estado !== "Pagado" && e.estado !== "Vencido")
    .reduce((sum, e) => sum + parseArgentineCurrency(e.saldo), 0);
  const pasivos = currentMonthExpenses
    .filter((e) => e.estado === "Vencido")
    .reduce((sum, e) => sum + parseArgentineCurrency(e.saldo), 0);

  return {
    proyectado,
    cobrado,
    porCobrar,
    deuda,
    posicionCaja,
    gastosProyectados,
    pasivos,
  };
}
import { parseArgentineCurrency } from "@/lib/utils/parse-currency";
