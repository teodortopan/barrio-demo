"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_SHORT_LABELS,
  normalizeExpenseCategory,
} from "@/lib/expenses/categories";
import { parseArgentineCurrency } from "@/lib/utils/parse-currency";

interface ExpenseData {
  fecha: string;
  categoria: string;
  saldo: string;
  estado: string;
}

interface GastosPorRubroChartProps {
  initialExpenses?: ExpenseData[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function GastosPorRubroChart({ initialExpenses }: GastosPorRubroChartProps) {
  const [expensesData, setExpensesData] = useState<ExpenseData[]>(initialExpenses || []);
  const [loading, setLoading] = useState(initialExpenses === undefined);

  useEffect(() => {
    if (initialExpenses !== undefined) return;
    async function fetchExpenses() {
      try {
        const res = await fetch("/api/expenses");
        const data = await res.json();
        if (data.expenses) {
          setExpensesData(data.expenses);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, [initialExpenses]);

  // Current month filter (Buenos Aires timezone)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthExpenses = expensesData.filter((e) => e.fecha?.startsWith(monthPrefix));
  const paidExpenses = currentMonthExpenses.filter((e) => e.estado === "Pagado");

  const categoryTotals: Record<string, number> = Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c, 0])
  );
  paidExpenses.forEach((expense) => {
    const saldo = parseArgentineCurrency(expense.saldo);
    const category = normalizeExpenseCategory(expense.categoria);
    categoryTotals[category] += saldo;
  });

  const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  const hasData = totalSpending > 0;

  const chartData = EXPENSE_CATEGORIES.map((category) => ({
    name: category,
    value: hasData ? (categoryTotals[category] / totalSpending) * 100 : 0,
    total: categoryTotals[category],
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex items-center justify-center h-full">
        <p className="text-sm text-[#4d6547]">Cargando…</p>
      </div>
    );
  }

  const monthLabel = (() => {
    const months = [
      "enero","febrero","marzo","abril","mayo","junio",
      "julio","agosto","septiembre","octubre","noviembre","diciembre",
    ];
    const cap = months[now.getMonth()].charAt(0).toUpperCase() + months[now.getMonth()].slice(1);
    return `${cap} ${now.getFullYear()}`;
  })();

  return (
    <div data-tour-id="info-gastos-rubro" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col w-full h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Gráfico de egresos
        </h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
          {monthLabel}
        </span>
      </div>

      {/* Cream card matching the egresos table aesthetic */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden p-3">
        <div className="flex-1 min-h-[300px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
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
                  tick={{ fontSize: 8, fill: "#4d6547" }}
                  width={100}
                  tickFormatter={(name: string) => EXPENSE_CATEGORY_SHORT_LABELS[normalizeExpenseCategory(name)] || name}
                  stroke="#c9b893"
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
                          fontSize: "10px",
                          padding: "6px 10px",
                          maxWidth: "200px",
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
                  wrapperStyle={{ maxWidth: "220px" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`bar-${entry.name}`} fill={EXPENSE_CATEGORY_COLORS[normalizeExpenseCategory(entry.name)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-[#4d6547] text-center">
                Sin gastos registrados como pagados este mes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
