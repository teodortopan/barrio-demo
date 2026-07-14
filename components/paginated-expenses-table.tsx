"use client";

import { Minus, Eye, X, Upload, ChevronUp, ChevronDown } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/categories";
import { computeEstado } from "@/lib/expenses/estado";
import { parseArgentineCurrency } from "@/lib/utils/parse-currency";

interface ExpenseRow {
  id?: string;
  fecha: string;
  vencimiento: string;
  concepto: string;
  categoria: string;
  proveedor: string;
  saldo: string;
  comprobante: string;
  factura: string;
  estado: string;
  created_at?: string;
}

export type EditableField = "fecha" | "vencimiento" | "concepto" | "categoria" | "proveedor" | "saldo";
export type ExpenseSortField = "fecha" | "vencimiento" | "concepto" | "categoria" | "proveedor" | "saldo";
export type ExpenseSortDirection = "asc" | "desc";

interface PaginatedExpensesTableProps {
  rows: ExpenseRow[];
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onComprobanteClick?: (index: number) => void;
  onFacturaClick?: (index: number) => void;
  onDeleteClick?: (index: number) => void;
  onDeleteComprobante?: (index: number) => void;
  onDeleteFactura?: (index: number) => void;
  onEstadoChange?: (index: number, newEstado: string) => void;
  isEditMode?: boolean;
  editingFields?: Map<string, string>;
  onEditValueChange?: (key: string, value: string) => void;
  onRemoveEdit?: (key: string) => void;
  onSaveAll?: (pendingEdit?: { key: string; value: string }) => Promise<void>;
  sortField?: ExpenseSortField;
  sortDirection?: ExpenseSortDirection;
  onSort?: (field: ExpenseSortField) => void;
  canManage?: boolean;
}

// Format date to DD/MM/YY — handles both YYYY-MM-DD and ISO timestamps
function formatFecha(dateStr: string): string {
  if (!dateStr) return "-";
  const dateOnly = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = dateOnly[1];
    const yy = year.slice(-2);
    return `${dateOnly[3]}/${dateOnly[2]}/${yy}`;
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

// Normalise to YYYY-MM-DD for <input type="date"> — handles ISO timestamps,
// pure YYYY-MM-DD, and empty. Without this the native picker opens blank when
// the API returns created_at (timestamp) as a fallback for fecha.
function toDateInputValue(raw: string): string {
  if (!raw) return "";
  const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatSaldoDisplay(saldo: string): string {
  const num = parseSaldoToNumber(saldo);
  if (!num && num !== 0) return saldo;
  if (isNaN(num)) return saldo;
  const prefix = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const formatted = parseInt(intPart).toLocaleString("es-AR");
  return decPart === "00" ? `$${prefix}${formatted}` : `$${prefix}${formatted},${decPart}`;
}

export function parseSaldoToNumber(saldo: unknown): number {
  return parseArgentineCurrency(saldo);
}

// Color for estado badge — matches the cream/forest pill aesthetic
function estadoColor(estado: string): string {
  switch (estado) {
    case "Pagado":
      return "bg-green-50 text-green-700";
    case "Vencido":
      return "bg-red-50 text-red-700";
    case "Pendiente":
    default:
      return "bg-orange-50 text-orange-600";
  }
}

export function PaginatedExpensesTable({
  rows,
  itemsPerPage = 10,
  currentPage: externalCurrentPage,
  onComprobanteClick,
  onFacturaClick,
  onDeleteClick,
  onDeleteComprobante,
  onDeleteFactura,
  onEstadoChange,
  isEditMode = false,
  editingFields = new Map(),
  onEditValueChange,
  onSaveAll,
  sortField,
  sortDirection = "asc",
  onSort,
  canManage = true,
}: PaginatedExpensesTableProps) {
  const SortIcon = ({ field }: { field: ExpenseSortField }) => {
    const isActive = sortField === field;
    return (
      <span className="inline-flex flex-col ml-1 -space-y-0.5">
        <ChevronUp className={`w-4 h-4 ${isActive && sortDirection === "asc" ? "text-[#2d5016]" : "text-gray-400"}`} />
        <ChevronDown className={`w-4 h-4 ${isActive && sortDirection === "desc" ? "text-[#2d5016]" : "text-gray-400"}`} />
      </span>
    );
  };
  const currentPage = externalCurrentPage ?? 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);



  const effectiveEditMode = canManage && isEditMode;
  const emptyCols = effectiveEditMode ? 10 : 9; // number of table columns; delete column only shows in edit mode

  const getEditKey = (row: ExpenseRow, field: string) =>
    row.id ? `${row.id}::${field}` : null;

  const getOriginalValue = (row: ExpenseRow, field: EditableField): string => {
    if (field === "fecha") return formatFecha(row.fecha);
    if (field === "vencimiento") return formatFecha(row.vencimiento);
    if (field === "concepto") return row.concepto;
    if (field === "categoria") return row.categoria;
    if (field === "proveedor") return row.proveedor || "";
    if (field === "saldo") return row.saldo.replace(/^\$/, "");
    return "";
  };

  const getDisplayValue = (row: ExpenseRow, field: EditableField): string => {
    const key = getEditKey(row, field);
    if (key && editingFields.has(key)) {
      const v = editingFields.get(key)!;
      if (field === "proveedor" && v === "") return "-";
      if (field === "saldo" && !v.startsWith("$")) return `$${v}`;
      return v;
    }
    if (field === "fecha") return formatFecha(row.fecha);
    if (field === "vencimiento") return formatFecha(row.vencimiento);
    if (field === "concepto") return row.concepto;
    if (field === "categoria") return row.categoria;
    if (field === "proveedor") return row.proveedor || "-";
    if (field === "saldo") return formatSaldoDisplay(row.saldo);
    return "";
  };

  const sortableThClass =
    "px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors";

  return (
    <div className="flex flex-col min-w-0">
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden mb-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="bg-[#2d5016]/10 border-b border-[#E9E2CE]">
                {effectiveEditMode && (
                  <th className="px-1 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] w-8"></th>
                )}
                <th className={`${sortableThClass} whitespace-nowrap`} onClick={() => onSort?.("fecha")}>
                  <span className="inline-flex items-center justify-center gap-1">FECHA<SortIcon field="fecha" /></span>
                </th>
                <th className={`${sortableThClass} whitespace-nowrap`} onClick={() => onSort?.("vencimiento")}>
                  <span className="inline-flex items-center justify-center gap-1">VENCIMIENTO<SortIcon field="vencimiento" /></span>
                </th>
                <th className={`${sortableThClass} min-w-[170px]`} onClick={() => onSort?.("concepto")}>
                  <span className="inline-flex items-center justify-center gap-1">CONCEPTO<SortIcon field="concepto" /></span>
                </th>
                <th className={`${sortableThClass} min-w-[180px]`} onClick={() => onSort?.("categoria")}>
                  <span className="inline-flex items-center justify-center gap-1">CATEGORÍA<SortIcon field="categoria" /></span>
                </th>
                <th className={`${sortableThClass} min-w-[160px]`} onClick={() => onSort?.("proveedor")}>
                  <span className="inline-flex items-center justify-center gap-1">PROVEEDOR<SortIcon field="proveedor" /></span>
                </th>
                <th className={sortableThClass} onClick={() => onSort?.("saldo")}>
                  <span className="inline-flex items-center justify-center gap-1">SALDO<SortIcon field="saldo" /></span>
                </th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">COMPROBANTE</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">FACTURA</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((row, index) => {
                  const globalIndex = startIndex + index;
                  return (
                    <tr key={row.id || `row-${globalIndex}`} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                      {effectiveEditMode && (
                        <td className="px-1 py-2 text-center align-middle w-8">
                          <button
                            onClick={() => onDeleteClick?.(globalIndex)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] whitespace-nowrap">
                        {effectiveEditMode && row.id ? (
                          <input
                            type="date"
                            value={toDateInputValue(editingFields.get(getEditKey(row, "fecha")!) ?? row.fecha)}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "fecha")!, e.target.value)}
                            onClick={(e) => {
                              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                              if (typeof el.showPicker === "function") el.showPicker();
                            }}
                            className="w-28 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-1.5 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors cursor-pointer"
                          />
                        ) : (
                          <span>{getDisplayValue(row, "fecha")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] whitespace-nowrap">
                        {effectiveEditMode && row.id ? (
                          <input
                            type="date"
                            value={toDateInputValue(editingFields.get(getEditKey(row, "vencimiento")!) ?? row.vencimiento ?? "")}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "vencimiento")!, e.target.value)}
                            onClick={(e) => {
                              const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                              if (typeof el.showPicker === "function") el.showPicker();
                            }}
                            className="w-28 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-1.5 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors cursor-pointer"
                          />
                        ) : (
                          <span>{getDisplayValue(row, "vencimiento")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] break-words">
                        {effectiveEditMode && row.id ? (
                          <input
                            type="text"
                            value={editingFields.get(getEditKey(row, "concepto")!) ?? getOriginalValue(row, "concepto")}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "concepto")!, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSaveAll?.(); } }}
                            className="w-full text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          />
                        ) : (
                          getDisplayValue(row, "concepto")
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] break-words">
                        {effectiveEditMode && row.id ? (
                          <select
                            value={editingFields.get(getEditKey(row, "categoria")!) ?? getOriginalValue(row, "categoria")}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "categoria")!, e.target.value)}
                            className="w-full text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          getDisplayValue(row, "categoria")
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] break-words">
                        {effectiveEditMode && row.id ? (
                          <input
                            type="text"
                            value={editingFields.get(getEditKey(row, "proveedor")!) ?? getOriginalValue(row, "proveedor")}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "proveedor")!, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSaveAll?.(); } }}
                            className="w-full text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          />
                        ) : (
                          getDisplayValue(row, "proveedor")
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle text-[#1a1a1a] whitespace-nowrap">
                        {effectiveEditMode && row.id ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editingFields.get(getEditKey(row, "saldo")!) ?? getOriginalValue(row, "saldo")}
                            onChange={(e) => onEditValueChange?.(getEditKey(row, "saldo")!, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSaveAll?.(); } }}
                            placeholder="0"
                            className="w-20 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          />
                        ) : (
                          <span>{getDisplayValue(row, "saldo")}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle">
                        {row.comprobante === "button" || !row.comprobante ? (
                          <button
                            onClick={() => onComprobanteClick?.(globalIndex)}
                            disabled={!canManage}
                            className="text-gray-400 hover:text-[#1a1a1a] transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-400"
                            title="Subir comprobante"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <a
                              href={row.comprobante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2d5016] hover:text-[#3a6a1f] inline-flex items-center justify-center"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {effectiveEditMode && row.id && (
                              <button
                                onClick={() => onDeleteComprobante?.(globalIndex)}
                                className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar comprobante"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-center align-middle">
                        {!row.factura ? (
                          <button
                            onClick={() => onFacturaClick?.(globalIndex)}
                            disabled={!canManage}
                            className="text-gray-400 hover:text-[#1a1a1a] transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-gray-400"
                            title="Subir factura"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <a
                              href={row.factura}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2d5016] hover:text-[#3a6a1f] inline-flex items-center justify-center"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {effectiveEditMode && row.id && (
                              <button
                                onClick={() => onDeleteFactura?.(globalIndex)}
                                className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar factura"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center align-middle">
                        {(() => {
                          const effective = computeEstado(row.estado, row.vencimiento);
                          return (
                            <select
                              value={effective}
                              onChange={(e) => onEstadoChange?.(globalIndex, e.target.value)}
                              disabled={!canManage}
                              className={`rounded-[14px] px-2 py-0.5 text-[10px] font-semibold border-0 focus:outline-none focus:ring-1 focus:ring-[#2d5016]/40 ${canManage ? "cursor-pointer" : "cursor-default"} ${estadoColor(effective)}`}
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Vencido">Vencido</option>
                              <option value="Pagado">Pagado</option>
                            </select>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : null}
              {Array.from({ length: Math.max(0, 35 - currentRows.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-dashed border-[#E9E2CE]">
                  {Array.from({ length: emptyCols }).map((_, j) => (
                    <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                  ))}
                </tr>
              ))}
              <tr className="bg-[#2d5016]/10 border-t border-[#E9E2CE] font-semibold">
                {effectiveEditMode && <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>}
                <td className="px-3 py-2 text-[11px] uppercase tracking-wider text-center text-[#2d5016]">TOTAL</td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]">{currentRows.length}</td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono">{formatSaldoDisplay(String(currentRows.reduce((sum, r) => sum + parseSaldoToNumber(r.saldo), 0)))}</td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
                <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
