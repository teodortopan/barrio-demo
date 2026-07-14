"use client";

interface FinancialSummaryDisplayProps {
  proyectado: number;
  cobrado: number;
  porCobrar: number;
  deuda: number;
  posicionCaja: number;
  gastosProyectados: number;
  pasivos: number;
}

export function FinancialSummaryDisplay({
  proyectado,
  cobrado,
  porCobrar,
  deuda,
  posicionCaja,
  gastosProyectados,
  pasivos,
}: FinancialSummaryDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cobradoPct = proyectado > 0 ? Math.round((cobrado / proyectado) * 100) : 0;
  const positive = posicionCaja >= 0;

  return (
    <div className="space-y-3">
      {/* Caja actual */}
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden flex">
        <div className="w-[3px] shrink-0 bg-[#2d5016]" />
        <div className="flex-1 min-w-0 p-3 space-y-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#2d5016]">
                Caja actual
              </span>
              <span className="text-[10px] text-[#4d6547] font-mono tabular-nums">
                {cobradoPct}%
              </span>
            </div>
            <p className="text-xl font-bold text-[#1a2617] font-mono leading-tight mt-0.5">
              {formatCurrency(proyectado)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mt-0.5">
              Proyectado
            </p>
            <div className="w-full bg-[#E9E2CE] rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="bg-[#2d5016] h-1 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(cobradoPct, 100)}%` }}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-[#E9E2CE]" />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                Cobrado
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-green-700">
                {formatCurrency(cobrado)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Por cobrar
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-amber-700">
                {formatCurrency(porCobrar)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Deuda
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-red-700">
                {formatCurrency(deuda)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Posición financiera */}
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden flex">
        <div className={`w-[3px] shrink-0 ${positive ? "bg-green-600" : "bg-red-500"}`} />
        <div className="flex-1 min-w-0 p-3 space-y-2.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[10px] uppercase tracking-[0.16em] font-bold ${
                  positive ? "text-green-700" : "text-red-700"
                }`}
              >
                Posición financiera
              </span>
              <span className="text-[10px] text-[#4d6547]">Cobrado − Egresos</span>
            </div>
            <p
              className={`text-xl font-bold font-mono leading-tight mt-0.5 ${
                positive ? "text-green-700" : "text-red-700"
              }`}
            >
              {formatCurrency(posicionCaja)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mt-0.5">
              Posición de la caja
            </p>
          </div>

          <div className="border-t border-dashed border-[#E9E2CE]" />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Gastos proyectados
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-amber-700">
                {formatCurrency(gastosProyectados)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Pasivos
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-red-700">
                {formatCurrency(pasivos)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
