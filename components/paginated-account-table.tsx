"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, X, Upload } from "lucide-react";
import { SaldoTooltip } from "./saldo-tooltip";
import { ACCOUNT_DATA_REFRESH_EVENT } from "@/lib/account-events";

interface AccountRow {
  fecha: string;
  limite: string;
  descripcion: string;
  cargo: string;
  pagos: string;
  saldo: string;
  expenseBreakdown?: Array<{ name: string; amount: string }>;
  comprobanteUrl?: string | null;
  isCurrent?: boolean;
}

interface VecinoData {
  id?: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  comprobante_url?: string | null;
}

interface PaginatedAccountTableProps {
  rows: AccountRow[];
  itemsPerPage?: number;
  vecinoData?: VecinoData | null;
}

export function PaginatedAccountTable({
  rows,
  itemsPerPage = 10,
  vecinoData,
}: PaginatedAccountTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [localComprobante, setLocalComprobante] = useState<string | null | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentComprobanteUrl =
    localComprobante !== undefined ? localComprobante : vecinoData?.comprobante_url || null;

  useEffect(() => {
    setLocalComprobante(undefined);
  }, [vecinoData?.id, vecinoData?.comprobante_url]);

  const requestAccountRefresh = () => {
    window.dispatchEvent(new CustomEvent(ACCOUNT_DATA_REFRESH_EVENT));
  };

  const handleComprobanteUpload = async (file: File) => {
    if (!vecinoData?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vecinoId", vecinoData.id);
      const res = await fetch("/api/vecinos/upload-comprobante", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success && result.comprobante_url) {
        setLocalComprobante(result.comprobante_url);
        requestAccountRefresh();
      } else if (!res.ok || result.error) {
        alert(result.error || "Error al subir el comprobante");
      }
    } catch (err) {
      console.error("Error uploading comprobante:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteComprobante = async () => {
    if (!vecinoData?.id) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/vecinos/delete-comprobante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vecinoId: vecinoData.id }),
      });
      const result = await res.json();
      if (result.success) {
        setLocalComprobante(null);
        requestAccountRefresh();
      } else {
        alert(result.error || "Error al eliminar el comprobante");
      }
    } catch {
      alert("Error al eliminar el comprobante");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Cream card with forest accent stripe — matches recordatorios aesthetic */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-[#2d5016]/10 border-b border-[#E9E2CE]">
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">FECHA</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">LÍMITE</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">DESCRIPCIÓN</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">CARGO</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">PAGO</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">SALDO</th>
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">COMPROBANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length > 0 ? (
                    currentRows.map((row, index) => (
                      <tr key={index} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                        <td className="px-3 py-2 text-xs text-center text-[#3c3c3c]">{row.fecha}</td>
                        <td className="px-3 py-2 text-xs text-center text-[#3c3c3c]">{row.limite}</td>
                        <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] font-medium">{row.descripcion}</td>
                        <td className="px-3 py-2 text-xs text-center text-[#3c3c3c]">
                          {row.cargo.startsWith('$') ? row.cargo : `$${row.cargo}`}
                        </td>
                        <td className="px-3 py-2 text-xs text-center text-[#3c3c3c]">{row.pagos}</td>
                        <td className={`px-3 py-2 text-xs text-center font-semibold ${(() => {
                          const saldoNum = parseFloat(row.saldo.replace(/[^0-9-]/g, ''));
                          if (saldoNum <= 0) return 'text-green-700';
                          const argDay = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getDate();
                          if (argDay <= 5) return 'text-green-700';
                          if (argDay <= 10) return 'text-orange-500';
                          return 'text-red-600';
                        })()}`}>
                          {row.expenseBreakdown ? (
                            <SaldoTooltip total={row.saldo} expenses={row.expenseBreakdown}>
                              <span className="cursor-help underline decoration-dotted">
                                {row.saldo}
                              </span>
                            </SaldoTooltip>
                          ) : (
                            <span>{row.saldo}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-center align-middle">
                          {(() => {
                            const isCurrent = row.isCurrent === true;
                            const url = isCurrent ? currentComprobanteUrl : (row.comprobanteUrl || null);
                            if (url) {
                              return (
                                <div className="inline-flex items-center gap-1.5">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] hover:bg-[#2d5016]/20 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                  {isCurrent && (
                                    <button
                                      onClick={() => setConfirmDelete(true)}
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      title="Eliminar comprobante"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            if (isCurrent && vecinoData?.id) {
                              return (
                                <label className="inline-flex items-center justify-center w-6 h-6 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] hover:bg-[#2d5016]/20 transition-colors cursor-pointer" title="Subir comprobante">
                                  {uploading ? <span className="text-[10px]">...</span> : <Upload className="w-3.5 h-3.5" />}
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleComprobanteUpload(f);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              );
                            }
                            return <span className="text-xs text-gray-400">-</span>;
                          })()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    Array.from({ length: itemsPerPage }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-dashed border-[#E9E2CE]">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination footer */}
        <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-2.5 border-t border-dashed border-[#E9E2CE]">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2.5 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-xs font-medium">
            {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-3">Eliminar comprobante</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-[14px] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteComprobante}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-[14px] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
