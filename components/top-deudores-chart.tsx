"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

interface TopDeudor {
  lote: string;
  propietario: string;
  saldo: number;
}

interface TopDeudoresChartProps {
  initialRows: TopDeudor[];
  unavailable?: boolean;
  tourId?: string;
}

// Same earth + forest palette used by the gastos chart so the page reads as one set.
const COLORS = [
  "#2d5016", "#5c3d1f", "#b06d3b", "#b8964c", "#7a8536",
  "#9aae93", "#8b6f47", "#6b8463", "#a98a5e", "#c9b893",
];

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function formatLoteLabel(lote: string): string {
  const lotes = lote
    .split(/[,\s;/+-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (lotes.length <= 3) return `Lote ${lote || "—"}`;

  return `Lotes ${lotes.slice(0, 3).join(", ")} +${lotes.length - 3}`;
}

function DeudorAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const [loteLabel = "", propietario = ""] = String(payload?.value || "").split(" · ");

  return (
    <g transform={`translate(${x || 0},${y || 0})`}>
      <text textAnchor="end" fill="#4d6547">
        <tspan x={0} dy="-0.15em" fontSize={10} fontWeight={700}>
          {truncateText(loteLabel, 20)}
        </tspan>
        {propietario ? (
          <tspan x={0} dy="1.15em" fontSize={9} fontWeight={500}>
            {truncateText(propietario, 22)}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}

export function TopDeudoresChart({ initialRows, unavailable = false, tourId }: TopDeudoresChartProps) {
  const rows = (initialRows || []).slice(0, 10);
  const hasData = rows.length > 0 && rows.some((r) => r.saldo > 0);

  const chartData = rows.map((r) => ({
    name: r.propietario
      ? `${formatLoteLabel(r.lote)} · ${r.propietario}`
      : formatLoteLabel(r.lote),
    fullName: r.propietario
      ? `Lote ${r.lote || "—"} · ${r.propietario}`
      : `Lote ${r.lote || "—"}`,
    saldo: r.saldo,
  }));

  return (
    <div data-tour-id={tourId} className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col w-full h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Top deudores
        </h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
          {unavailable ? "No disponible" : "Top 10"}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden p-3">
        <div className="flex-1 min-h-[300px]">
          {unavailable ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-[#4d6547] text-center">
                No se pudo cargar la lista de deudores.
              </p>
            </div>
          ) : hasData ? (
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
                  tickFormatter={(v) => formatCompact(Number(v))}
                  stroke="#c9b893"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<DeudorAxisTick />}
                  interval={0}
                  width={145}
                  stroke="#c9b893"
                />
                <Tooltip
                  cursor={{ fill: "rgba(45, 80, 22, 0.06)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload as { fullName: string; saldo: number };
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
                          {data.fullName}
                        </p>
                        <p style={{ color: "#b91c1c" }}>{formatCurrency(data.saldo)}</p>
                      </div>
                    );
                  }}
                  wrapperStyle={{ maxWidth: "220px" }}
                />
                <Bar dataKey="saldo" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-[#4d6547] text-center">
                Sin lotes deudores. ¡Todos al día!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
