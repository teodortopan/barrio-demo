"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter, Eye } from "lucide-react";
import { parseArgentineCurrency } from "@/lib/utils/parse-currency";

interface ExpenseRow {
  fecha: string;
  concepto: string;
  saldo: string;
  estado: string;
  comprobante: string;
  factura?: string;
}

interface PublicExpensesTableProps {
  initialRows?: ExpenseRow[];
}

function formatFecha(dateStr: string): string {
  if (!dateStr) return "-";
  const dateOnly = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1].slice(-2)}`;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${yy}`;
  } catch {
    return dateStr;
  }
}

function formatSaldo(saldo: string): string {
  const num = parseSaldoToNumber(saldo);
  if (!num && num !== 0) return saldo;
  if (isNaN(num)) return saldo;
  const prefix = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const formatted = parseInt(intPart).toLocaleString("es-AR");
  return decPart === "00" ? `$${prefix}${formatted}` : `$${prefix}${formatted},${decPart}`;
}

function parseSaldoToNumber(saldo: unknown): number {
  return parseArgentineCurrency(saldo);
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function PublicExpensesTable({ initialRows }: PublicExpensesTableProps) {
  const [rows, setRows] = useState<ExpenseRow[]>(initialRows ?? []);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const [filterMonth, setFilterMonth] = useState<number | null>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | null>(now.getFullYear());
  const filterRef = useRef<HTMLDivElement>(null);
  type SortField = "fecha" | "concepto" | "saldo";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("fecha");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "fecha" ? "desc" : "asc");
    }
  };

  useEffect(() => {
    if (initialRows !== undefined) return;
    async function fetchExpenses() {
      try {
        const res = await fetch("/api/expenses");
        const data = await res.json();
        if (data.expenses) {
          setRows(
            data.expenses.map((e: Record<string, unknown>) => ({
              fecha: (e.fecha as string) || "",
              concepto: (e.concepto as string) || "",
              saldo: (e.saldo as string) || "",
              estado: (e.estado as string) || "Pendiente",
              comprobante: (e.comprobante as string) || "",
              factura: (e.factura as string) || "",
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchExpenses();
  }, [initialRows]);

  // Close filter on click outside
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isFilterOpen]);

  const currentYear = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  ).getFullYear();

  const availableYears = Array.from(
    new Set([
      currentYear,
      ...rows
        .map((r) => {
          const m = r.fecha?.match(/^(\d{4})/);
          return m ? parseInt(m[1]) : null;
        })
        .filter((y): y is number => y !== null),
    ])
  ).sort((a, b) => b - a);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = rows.filter((r) => {
      if (filterMonth !== null || filterYear !== null) {
        const m = r.fecha?.match(/^(\d{4})-(\d{2})/);
        if (m) {
          const y = parseInt(m[1]);
          const mo = parseInt(m[2]);
          if (filterYear !== null && y !== filterYear) return false;
          if (filterMonth !== null && mo !== filterMonth) return false;
        } else {
          return false;
        }
      }
      if (!q) return true;
      return (
        r.concepto.toLowerCase().includes(q) ||
        r.saldo.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "fecha") {
        cmp = (a.fecha || "").localeCompare(b.fecha || "");
      } else if (sortField === "concepto") {
        cmp = (a.concepto || "").localeCompare(b.concepto || "", "es", { sensitivity: "base" });
      } else if (sortField === "saldo") {
        cmp = parseSaldoToNumber(a.saldo) - parseSaldoToNumber(b.saldo);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, searchQuery, filterMonth, filterYear, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 opacity-50" strokeWidth={2} />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
      : <ChevronDown className="w-3 h-3" strokeWidth={2.5} />;
  };

  const sortableHeaderClass =
    "px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]";
  const sortableButtonClass =
    "inline-flex items-center justify-center gap-1 rounded-[14px] px-1.5 py-1 uppercase tracking-wider hover:bg-[#2d5016]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5016]/40 transition-colors";

  if (loading) {
    return (
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-400">Cargando egresos…</p>
      </div>
    );
  }

  const filtersActive = filterMonth !== null || filterYear !== null;

  return (
    <div data-tour-id="info-egresos" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col w-full h-full min-h-0">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Egresos
        </h2>
      </div>

      {/* Search + Filter bar */}
      <div className="relative mb-3" ref={filterRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
        <button
          type="button"
          onClick={() => setIsFilterOpen((v) => !v)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-[14px] transition-colors z-10 ${
            filtersActive
              ? "bg-[#2d5016]/10 text-[#2d5016]"
              : "text-[#4d6547] hover:bg-[#eef1ea]"
          }`}
          title="Filtrar por mes y año"
        >
          <Filter className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por concepto o saldo…"
          className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-11 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
        />
        {/* Month/Year Filter Dropdown */}
        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-3 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Mes</label>
              <select
                value={filterMonth ?? ""}
                onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
              >
                <option value="">Todos</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Año</label>
              <select
                value={filterYear ?? ""}
                onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
                className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
              >
                <option value="">Todos</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {filtersActive && (
              <button
                onClick={() => { setFilterMonth(null); setFilterYear(null); }}
                className="px-2 py-0.5 rounded-[14px] text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cream card — matches cuenta corriente / recordatorios aesthetic */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[34%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead>
              <tr className="bg-[#2d5016]/10 border-b border-[#E9E2CE]">
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "fecha" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("fecha")} className={sortableButtonClass}>
                    FECHA <SortIcon field="fecha" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "concepto" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("concepto")} className={sortableButtonClass}>
                    CONCEPTO <SortIcon field="concepto" />
                  </button>
                </th>
                <th className={sortableHeaderClass} scope="col" aria-sort={sortField === "saldo" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => handleSort("saldo")} className={sortableButtonClass}>
                    SALDO <SortIcon field="saldo" />
                  </button>
                </th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]" scope="col">ESTADO</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]" scope="col">COMP.</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]" scope="col">FAC.</th>
              </tr>
            </thead>
          </table>

          {/* Scrollable body — fixed height */}
          <div className="overflow-y-auto max-h-[260px] min-w-[600px]">
            <table className="w-full min-w-[600px] table-fixed">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[34%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
              </colgroup>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={index} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                    <td className="px-3 py-2 text-xs text-center align-middle text-[#3c3c3c] whitespace-nowrap">
                      {formatFecha(row.fecha)}
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] font-medium">
                      {row.concepto || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle text-[#3c3c3c] whitespace-nowrap font-mono">
                      {formatSaldo(row.saldo)}
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[14px] text-[10px] font-semibold ${
                        row.estado === "Pagado"
                          ? "bg-green-50 text-green-700"
                          : row.estado === "Vencido"
                          ? "bg-red-50 text-red-700"
                          : "bg-orange-50 text-orange-600"
                      }`}>
                        {row.estado || "Pendiente"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle">
                      {row.comprobante && row.comprobante !== "button" ? (
                        <a
                          href={row.comprobante}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] hover:bg-[#2d5016]/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle">
                      {row.factura ? (
                        <a
                          href={row.factura}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] hover:bg-[#2d5016]/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Filler rows so TOTAL isn't flush to top when few entries */}
                {Array.from({ length: Math.max(0, 5 - filteredRows.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-b border-dashed border-[#E9E2CE]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                    ))}
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="bg-[#2d5016]/10 border-t border-[#E9E2CE] font-semibold">
                  <td className="px-3 py-2 text-[11px] uppercase tracking-wider text-center text-[#2d5016]">TOTAL</td>
                  <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]">{filteredRows.length}</td>
                  <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono">
                    {formatSaldo(String(filteredRows.reduce((sum, r) => sum + parseSaldoToNumber(r.saldo), 0)))}
                  </td>
                  <td />
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
