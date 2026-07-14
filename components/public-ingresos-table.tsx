"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";

interface DeudorRow {
  id?: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  saldo: number;
  estado: string;
}

interface PublicIngresosTableProps {
  initialRows?: DeudorRow[];
  unavailable?: boolean;
}

type SortField = "lote" | "propietario" | "concepto" | "cargo" | "saldo";
type SortDirection = "asc" | "desc";

function formatARS(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  const prefix = n < 0 ? "-" : "";
  return `$${prefix}${Math.abs(n).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function loteNumber(lote: string): number {
  return parseInt(String(lote || "").match(/\d+/)?.[0] || "0") || 0;
}

export function PublicIngresosTable({ initialRows, unavailable = false }: PublicIngresosTableProps) {
  const [rows] = useState<DeudorRow[]>(initialRows ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("lote");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.lote.toLowerCase().includes(q) ||
            r.propietario.toLowerCase().includes(q) ||
            r.concepto.toLowerCase().includes(q)
        )
      : rows;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "lote") {
        cmp = loteNumber(a.lote) - loteNumber(b.lote);
        if (cmp === 0) cmp = a.lote.localeCompare(b.lote, "es");
      } else if (sortField === "propietario") {
        cmp = a.propietario.localeCompare(b.propietario, "es", { sensitivity: "base" });
      } else if (sortField === "concepto") {
        cmp = a.concepto.localeCompare(b.concepto, "es", { sensitivity: "base" });
      } else if (sortField === "cargo") {
        cmp = a.cargo - b.cargo;
      } else if (sortField === "saldo") {
        cmp = a.saldo - b.saldo;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, searchQuery, sortField, sortDir]);

  const totalAdeudado = filteredRows.reduce((sum, r) => sum + (r.saldo || 0), 0);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3 h-3 opacity-50" strokeWidth={2} />;
    }
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
    ) : (
      <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
    );
  };

  const sortableHeaderClass =
    "px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]";
  const sortableButtonClass =
    "inline-flex items-center justify-center gap-1 rounded-[14px] px-1.5 py-1 uppercase tracking-wider hover:bg-[#2d5016]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5016]/40 transition-colors";

  return (
    <div data-tour-id="info-ingresos" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col w-full h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Deudores
        </h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
          {unavailable ? "No disponible" : `${filteredRows.length} ${filteredRows.length === 1 ? "lote" : "lotes"}`}
        </span>
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por lote o concepto…"
          className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
        />
      </div>

      {/* Cream card — matches egresos / cuenta corriente aesthetic */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#2d5016]/10 border-b border-[#E9E2CE]">
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "lote" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("lote")} className={sortableButtonClass}>
                    LOTE <SortIcon field="lote" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "propietario" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("propietario")} className={sortableButtonClass}>
                    PROPIETARIO <SortIcon field="propietario" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "concepto" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("concepto")} className={sortableButtonClass}>
                    CONCEPTO <SortIcon field="concepto" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "cargo" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("cargo")} className={sortableButtonClass}>
                    CARGO <SortIcon field="cargo" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "saldo" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("saldo")} className={sortableButtonClass}>
                    SALDO <SortIcon field="saldo" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]" scope="col">ESTADO</th>
              </tr>
            </thead>
          </table>

          <div className="overflow-y-auto max-h-[260px] min-w-[600px]">
            <table className="w-full min-w-[600px] table-fixed">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <tbody>
                {unavailable ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-[#4d6547]">
                      No se pudo cargar la lista de deudores.
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id || `${row.lote}-${row.concepto}`}
                      className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] font-mono font-semibold">
                        {row.lote || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a]">
                        {row.propietario || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a]">
                        {row.concepto || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#3c3c3c] font-mono whitespace-nowrap">
                        {formatARS(row.cargo)}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-red-600 font-mono font-semibold whitespace-nowrap">
                        {formatARS(row.saldo)}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-red-50 text-red-700 text-[10px] font-semibold whitespace-nowrap">
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-xs text-[#4d6547]">
                      {searchQuery
                        ? "No se encontraron lotes que coincidan."
                        : "Sin lotes deudores. ¡Todos al día!"}
                    </td>
                  </tr>
                )}
                {/* Filler rows so total isn't flush to top when few entries */}
                {!unavailable && filteredRows.length > 0 &&
                  Array.from({ length: Math.max(0, 5 - filteredRows.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-dashed border-[#E9E2CE]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                      ))}
                    </tr>
                  ))}
                {/* Totals row */}
                {!unavailable && filteredRows.length > 0 && (
                  <tr className="bg-[#2d5016]/10 border-t border-[#E9E2CE] font-semibold">
                    <td className="px-3 py-2 text-[11px] uppercase tracking-wider text-center text-[#2d5016]">TOTAL</td>
                    <td />
                    <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]">{filteredRows.length}</td>
                    <td />
                    <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono whitespace-nowrap">
                      {formatARS(totalAdeudado)}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
