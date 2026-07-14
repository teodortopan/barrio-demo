"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3 } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_SHORT_LABELS,
  normalizeExpenseCategory,
} from "@/lib/expenses/categories";
import { parseArgentineCurrency } from "@/lib/utils/parse-currency";

interface VecinoData {
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
}

// Cream/forest aesthetic palette — natural tones that pair with the rest of
// the page instead of bright primary colors.
const COLORS = {
  pagado: "#4d6547", // forest-500 — "good"
  deudor: "#b06d3b", // terracotta — "owed"
};

interface ExpenseData {
  id: string;
  fecha: string;
  vencimiento?: string;
  concepto: string;
  categoria: string;
  saldo: string;
  comprobante: string;
  estado: string;
}

interface PaymentPieChartsProps {
  initialVecinos?: VecinoData[];
  initialExpenses?: ExpenseData[];
}

interface ChartPayload {
  name: string;
  value?: number;
  total?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPayload }>;
}

export function PaymentPieCharts({ initialVecinos, initialExpenses }: PaymentPieChartsProps) {
  const hasInitial = initialVecinos !== undefined && initialExpenses !== undefined;
  const [vecinosData, setVecinosData] = useState<VecinoData[]>(initialVecinos || []);
  const [loading, setLoading] = useState(!hasInitial);
  const [expensesData, setExpensesData] = useState<ExpenseData[]>(initialExpenses || []);

  useEffect(() => {
    if (hasInitial) return;
    async function fetchData() {
      try {
        const vecinosResponse = await fetch("/api/vecinos");
        const vecinosResult = await vecinosResponse.json();

        if (vecinosResult.error) {
          console.error("Error fetching vecinos:", vecinosResult.error);
        } else {
          setVecinosData(vecinosResult.data || []);
        }

        const expensesResponse = await fetch("/api/expenses");
        const expensesResult = await expensesResponse.json();

        if (expensesResult.error) {
          console.error("Error fetching expenses:", expensesResult.error);
        } else {
          setExpensesData(expensesResult.expenses || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [hasInitial]);

  if (loading) {
    return (
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex items-center justify-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full border-2 border-[#2d5016]/30 border-t-[#2d5016] animate-spin" />
        <p className="text-sm text-[#4d6547]">Cargando gráficos…</p>
      </div>
    );
  }

  // Helper function to normalize values (handle string/number, null/undefined)
  const normalizeValue = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to check if saldo is greater than 0
  const isSaldoPositive = (saldo: number): boolean => {
    const roundedSaldo = Math.round(saldo * 100) / 100;
    return roundedSaldo > 0;
  };

  // Situación de Deuda: Ganancia (sum of pago) vs Deudores (sum of saldo where positive)
  const totalPago = vecinosData.reduce((sum, v) => sum + normalizeValue(v.pago), 0);

  const totalDeuda = vecinosData.reduce((sum, v) => {
    const saldo = normalizeValue(v.saldo);
    return sum + (isSaldoPositive(saldo) ? saldo : 0);
  }, 0);

  const totalDeudaChart = totalPago + totalDeuda;
  const porcentajeGanancia = totalDeudaChart > 0 ? (totalPago / totalDeudaChart) * 100 : 0;
  const porcentajeDeudores = totalDeudaChart > 0 ? (totalDeuda / totalDeudaChart) * 100 : 0;

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Data for Situación de Deuda pie chart: Ganancia (pago) vs Deudores (saldo)
  const paymentData = [
    {
      name: "Recaudado",
      value: porcentajeGanancia,
      total: totalPago,
    },
    {
      name: "Deudores",
      value: porcentajeDeudores,
      total: totalDeuda,
    },
  ];

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#faf6ec",
            border: "1px solid #d9d2bf",
            borderRadius: "14px",
            fontSize: "11px",
            padding: "8px 12px",
            maxWidth: "220px",
            color: "#1a2617",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {data.name}
          </p>
          {data.total !== undefined && (
            <p style={{ color: "#1a2617", fontFamily: "var(--font-mono, ui-monospace)", fontWeight: 600, marginTop: 2 }}>
              {formatCurrency(data.total)}
            </p>
          )}
          {data.value !== undefined && data.total !== undefined && (
            <p style={{ color: "#4d6547", fontSize: "10px", marginTop: 2 }}>
              {data.value.toFixed(1)}% del total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Compact custom legend that anchors below each chart in a fixed-height row,
  // so the wrapping never bleeds into the chart above or the chart below.
  const ChartLegend = ({
    items,
  }: {
    items: { label: string; color: string }[];
  }) => (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1.5">
      {items.map((it) => (
        <div key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: it.color }}
          />
          <span className="text-[10px] font-medium uppercase tracking-wide text-[#4d6547]">
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );

  // Current month filter (Buenos Aires timezone)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

  const currentMonthExpenses = expensesData.filter((e) => e.fecha?.startsWith(monthPrefix));

  // Calculate "Saldo total vs Gastos" data
  // Total income = sum of all pago values from vecinos
  const totalIncome = vecinosData.reduce((sum, v) => sum + normalizeValue(v.pago), 0);

  // Gastos = sum of saldo from paid expenses (current month only)
  const paidExpenses = currentMonthExpenses.filter((e) => e.estado === "Pagado");
  const totalGastos = paidExpenses.reduce((sum, e) => sum + parseArgentineCurrency(e.saldo), 0);

  // Saldo neto = income minus expenses (clamped to 0 if negative)
  const saldoNeto = Math.max(0, totalIncome - totalGastos);
  const saldoVsGastosTotal = saldoNeto + totalGastos;
  const hasSaldoGastosData = saldoVsGastosTotal > 0;

  const saldoVsGastosData = [
    {
      name: "Saldo",
      value: hasSaldoGastosData ? (saldoNeto / saldoVsGastosTotal) * 100 : 0,
      total: saldoNeto,
    },
    {
      name: "Gastos",
      value: hasSaldoGastosData ? (totalGastos / saldoVsGastosTotal) * 100 : 0,
      total: totalGastos,
    },
  ];

  // Calculate "Gastos por Rubro" data
  const categoryTotals: Record<string, number> = Object.fromEntries(
    EXPENSE_CATEGORIES.map((category) => [category, 0])
  );

  paidExpenses.forEach((expense) => {
    const saldo = parseArgentineCurrency(expense.saldo);
    const category = normalizeExpenseCategory(expense.categoria);
    categoryTotals[category] += saldo;
  });

  const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  const hasGastosData = totalSpending > 0;

  const gastosPorRubroData = EXPENSE_CATEGORIES.map((category) => ({
    name: category,
    value: hasGastosData ? (categoryTotals[category] / totalSpending) * 100 : 0,
    total: categoryTotals[category],
  }));

  // Calculate estado breakdown (Pendiente / Pagado / Vencido) from current month expenses
  const computeEffectiveEstado = (estado: string, vencimiento?: string): string => {
    if (estado === "Pagado") return "Pagado";
    if (estado === "Vencido") return "Vencido";
    if (vencimiento) {
      const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
      today.setHours(0, 0, 0, 0);
      const venc = new Date(vencimiento + "T00:00:00");
      if (!isNaN(venc.getTime()) && today > venc) return "Vencido";
    }
    return "Pendiente";
  };

  const estadoTotals = { Pendiente: 0, Pagado: 0, Vencido: 0 };
  currentMonthExpenses.forEach((e) => {
    const saldo = parseArgentineCurrency(e.saldo);
    const effective = computeEffectiveEstado(e.estado, e.vencimiento);
    if (effective in estadoTotals) estadoTotals[effective as keyof typeof estadoTotals] += saldo;
  });
  const totalEstado = estadoTotals.Pendiente + estadoTotals.Pagado + estadoTotals.Vencido;
  const hasEstadoData = totalEstado > 0;

  const estadoData = [
    { name: "Pendiente", value: hasEstadoData ? (estadoTotals.Pendiente / totalEstado) * 100 : 0, total: estadoTotals.Pendiente },
    { name: "Pagado", value: hasEstadoData ? (estadoTotals.Pagado / totalEstado) * 100 : 0, total: estadoTotals.Pagado },
    { name: "Vencido", value: hasEstadoData ? (estadoTotals.Vencido / totalEstado) * 100 : 0, total: estadoTotals.Vencido },
  ];
  // Pendiente → ochre, Pagado → forest, Vencido → terracotta
  const estadoColors = ["#b8964c", "#4d6547", "#b06d3b"];

  // Empty state placeholder for pie charts
  const emptyPieData = [{ name: "Sin datos", value: 100, total: 0 }];

  const monthLabel = now
    .toLocaleString("es-AR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // Wrapper for each chart slot — cream sub-card with eyebrow title + a fixed
  // chart area + a fixed-height legend row, so legends never overlap charts.
  const ChartCard = ({
    title,
    children,
    fullWidth = false,
  }: {
    title: string;
    children: React.ReactNode;
    fullWidth?: boolean;
  }) => (
    <div
      className={`flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3 ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#2d5016] mb-2 text-center">
        {title}
      </div>
      {children}
    </div>
  );

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col flex-1">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
            <BarChart3 className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
            Gráficos
          </h2>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
          {monthLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 auto-rows-fr">
        {/* Quadrant 1 - Cobrado (Saldo vs Gastos) */}
        <ChartCard title="Cobrado">
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasSaldoGastosData ? saldoVsGastosData : emptyPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius="80%"
                  innerRadius="45%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#faf6ec"
                  strokeWidth={2}
                >
                  {hasSaldoGastosData
                    ? saldoVsGastosData.map((entry, index) => (
                        <Cell
                          key={`cell-sv-${index}`}
                          fill={entry.name === "Saldo" ? "#4d6547" : "#8b6f47"}
                        />
                      ))
                    : [<Cell key="empty" fill="#E9E2CE" />]}
                </Pie>
                {hasSaldoGastosData && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: "Saldo", color: "#4d6547" },
              { label: "Gastos", color: "#8b6f47" },
            ]}
          />
        </ChartCard>

        {/* Quadrant 2 - Adeudado (Recaudado vs Deudores) */}
        <ChartCard title="Adeudado">
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalDeudaChart > 0 ? paymentData : emptyPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius="80%"
                  innerRadius="45%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#faf6ec"
                  strokeWidth={2}
                >
                  {totalDeudaChart > 0
                    ? paymentData.map((entry, index) => (
                        <Cell
                          key={`cell-sd-${index}`}
                          fill={entry.name === "Recaudado" ? COLORS.pagado : COLORS.deudor}
                        />
                      ))
                    : [<Cell key="empty" fill="#E9E2CE" />]}
                </Pie>
                {totalDeudaChart > 0 && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: "Recaudado", color: COLORS.pagado },
              { label: "Deudores", color: COLORS.deudor },
            ]}
          />
        </ChartCard>

        {/* Quadrant 3 - Gastos por rubro (Bar Chart) */}
        <ChartCard title="Gastos por rubro" fullWidth>
          <div className="flex-1 min-h-[240px]">
            {hasGastosData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gastosPorRubroData}
                  layout="vertical"
                  margin={{ top: 5, right: 16, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9E2CE" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 9, fill: "#4d6547" }}
                    tickFormatter={(v) => `${v.toFixed(0)}%`}
                    domain={[0, 100]}
                    stroke="#c9b893"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "#4d6547", fontWeight: 600 }}
                    width={120}
                    stroke="#c9b893"
                    tickFormatter={(name: string) => EXPENSE_CATEGORY_SHORT_LABELS[normalizeExpenseCategory(name)] || name}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(45, 80, 22, 0.06)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: "#faf6ec",
                            border: "1px solid #d9d2bf",
                            borderRadius: "14px",
                            fontSize: "11px",
                            padding: "6px 10px",
                            maxWidth: "220px",
                            color: "#1a2617",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        >
                          <p style={{ fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {data.name}
                          </p>
                          <p style={{ color: "#4d6547" }}>
                            {data.value.toFixed(1)}% · {formatCurrency(data.total || 0)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {gastosPorRubroData.map((entry) => (
                      <Cell key={`bar-${entry.name}`} fill={EXPENSE_CATEGORY_COLORS[normalizeExpenseCategory(entry.name)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-[#4d6547]">Sin gastos registrados como pagados</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Quadrant 4 - Estado de egresos (Pie Chart) */}
        <ChartCard title="Estado de egresos" fullWidth>
          <div className="flex-1 min-h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasEstadoData ? estadoData.filter((d) => d.value > 0) : emptyPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius="80%"
                  innerRadius="45%"
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#faf6ec"
                  strokeWidth={2}
                >
                  {hasEstadoData
                    ? estadoData
                        .filter((d) => d.value > 0)
                        .map((entry) => (
                          <Cell
                            key={`estado-${entry.name}`}
                            fill={
                              estadoColors[["Pendiente", "Pagado", "Vencido"].indexOf(entry.name)]
                            }
                          />
                        ))
                    : [<Cell key="empty" fill="#E9E2CE" />]}
                </Pie>
                {hasEstadoData && <Tooltip content={<CustomTooltip />} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ChartLegend
            items={[
              { label: "Pendiente", color: "#b8964c" },
              { label: "Pagado", color: "#4d6547" },
              { label: "Vencido", color: "#b06d3b" },
            ]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
