"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, XCircle, Eye, AlertTriangle, Bell } from "lucide-react";

interface PaymentRequest {
  id: string;
  user_id: string;
  vecino_id: string | null;
  payment_method: "efectivo" | "transferencia";
  amount: number;
  file_url: string | null;
  storage_path: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  vecino?: {
    lote: string;
    propietario: string;
    codigo: string | null;
  };
  user?: {
    name: string;
  };
}

interface PendingPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PendingPaymentsModal({ isOpen, onClose }: PendingPaymentsModalProps) {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    request: PaymentRequest;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPendingPayments();
    }
  }, [isOpen]);

  async function fetchPendingPayments() {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/pending");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching pending payments:", result.error);
        return;
      }

      setPaymentRequests(result.paymentRequests || []);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = (request: PaymentRequest) => {
    setConfirmAction({ type: "approve", request });
  };

  const handleReject = (request: PaymentRequest) => {
    setConfirmAction({ type: "reject", request });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;

    const { type, request } = confirmAction;
    const requestId = request.id;

    setProcessingId(requestId);

    try {
      const response = await fetch(`/api/payments/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: request.id,
        }),
      });

      const result = await response.json();

      if (result.error) {
        alert(`Error: ${result.error}`);
        setProcessingId(null);
        return;
      }

      setPaymentRequests(prev => prev.filter(req => req.id !== requestId));

      setConfirmAction(null);
      setProcessingId(null);

      await fetchPendingPayments();
    } catch (error) {
      console.error(`Error ${type === "approve" ? "approving" : "rejecting"} payment:`, error);
      alert(`Error al ${type === "approve" ? "aprobar" : "rechazar"} el pago`);
      setProcessingId(null);

      await fetchPendingPayments();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !mounted) return null;

  const node = (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[1000] grid place-items-center p-4"
        style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      >
        <div className="w-full max-w-4xl max-h-[90vh] bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE] flex-shrink-0"
            style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
          >
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
              <Bell className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                Ingresos
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 flex items-center gap-2">
                Pagos pendientes
                {paymentRequests.length > 0 && (
                  <span className="px-2 py-0.5 rounded-[14px] text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 normal-case tracking-normal">
                    {paymentRequests.length}
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-sm text-[#4d6547]">Cargando…</div>
              </div>
            ) : paymentRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-sm text-[#4d6547]">No hay pagos pendientes</div>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 transition-colors p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wide border ${
                              request.payment_method === "efectivo"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {request.payment_method === "efectivo" ? "Efectivo" : "Transferencia"}
                          </span>
                          <div className="text-base font-bold font-mono text-[#1a2617]">
                            {formatAmount(request.amount)}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-[#4d6547]">
                          {request.vecino && (
                            <>
                              <div>
                                <span className="font-medium text-[#1a2617]">Vecino:</span>{" "}
                                {request.vecino.propietario} (Lote: {request.vecino.lote})
                              </div>
                              {request.vecino.codigo && (
                                <div className="bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] px-3 py-2 my-1.5 inline-block">
                                  <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] block">
                                    Código
                                  </span>
                                  <span className="text-lg font-bold font-mono text-[#1a2617] tracking-wider">
                                    {request.vecino.codigo}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <span className="font-medium text-[#1a2617]">Fecha:</span> {formatDate(request.created_at)}
                          </div>
                          {request.file_url && (
                            <div>
                              <a
                                href={request.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#2d5016] hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ver comprobante
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-[14px] bg-green-50 text-green-700 border border-green-200 transition-colors ${
                            processingId === request.id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-green-100"
                          }`}
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request)}
                          disabled={processingId === request.id}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-[14px] bg-red-50 text-red-700 border border-red-200 transition-colors ${
                            processingId === request.id
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-red-100"
                          }`}
                          title="Rechazar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[1100] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div
              className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
              style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
            >
              <div
                className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] ${
                  confirmAction.type === "approve" ? "bg-[#2d5016]/10" : "bg-red-50"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    confirmAction.type === "approve" ? "text-[#2d5016]" : "text-red-600"
                  }`}
                  strokeWidth={1.6}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Confirmación
                </div>
                <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                  {confirmAction.type === "approve" ? "Aprobar pago" : "Rechazar pago"}
                </h2>
              </div>
              <button
                onClick={() => setConfirmAction(null)}
                className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#1a2617] mb-3">
                {confirmAction.type === "approve"
                  ? `¿Confirmás aprobar el pago de ${formatAmount(confirmAction.request.amount)}? Esto actualizará el saldo del vecino.`
                  : `¿Confirmás rechazar el pago de ${formatAmount(confirmAction.request.amount)}?`}
              </p>
              {confirmAction.request.vecino && (
                <div className="bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-0.5">
                    Vecino
                  </div>
                  <div className="text-xs text-[#1a2617]">
                    {confirmAction.request.vecino.propietario}{" "}
                    <span className="text-[#4d6547]">(Lote: {confirmAction.request.vecino.lote})</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2 border-t border-dashed border-[#E9E2CE]">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!!processingId}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmAction.type === "approve"
                    ? "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {processingId
                  ? confirmAction.type === "approve"
                    ? "Aprobando…"
                    : "Rechazando…"
                  : confirmAction.type === "approve"
                  ? "Aprobar"
                  : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(node, document.body);
}
