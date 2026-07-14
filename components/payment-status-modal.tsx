"use client";

import { useEffect, useState } from "react";
import { FileText, History, Loader2, X } from "lucide-react";

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MyPaymentRequest {
  id: string;
  payment_method: "efectivo" | "transferencia";
  amount: number;
  file_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

type StatusFilter = "all" | MyPaymentRequest["status"];

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "rejected", label: "Rechazados" },
];

const STATUS_BADGE: Record<
  MyPaymentRequest["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  approved: {
    label: "Aprobado",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  rejected: {
    label: "Rechazado",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

function formatFecha(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonto(amount: number): string {
  return `$ ${Math.round(Number(amount) || 0).toLocaleString("es-AR")}`;
}

export function PaymentStatusModal({ isOpen, onClose }: PaymentStatusModalProps) {
  const [requests, setRequests] = useState<MyPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setLoading(true);
    setLoadError(false);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    fetch("/api/payments/my-requests")
      .then((response) => {
        if (!response.ok) throw new Error("request failed");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setRequests(data.requests ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered =
    filter === "all" ? requests : requests.filter((request) => request.status === filter);
  const countFor = (key: StatusFilter) =>
    key === "all"
      ? requests.length
      : requests.filter((request) => request.status === key).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-status-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <History className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Pagos informados
            </div>
            <h2
              id="payment-status-title"
              className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5"
            >
              Estado de mis pagos
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 rounded-[14px] text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-[#2d3d2a] text-[#faf6ec] border-[#2d3d2a]"
                    : "bg-white text-[#4d6547] border-[#d9d2bf] hover:bg-[#eef1ea]"
                }`}
              >
                {item.label}
                {!loading && !loadError && (
                  <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 opacity-60"}>
                    {countFor(item.key)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#4d6547]">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-sm text-[#4d6547]">
              No pudimos cargar tus pagos.
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#4d6547]">
              {filter === "all"
                ? "Todavía no informaste ningún pago."
                : `No tenés pagos ${FILTERS.find((item) => item.key === filter)?.label.toLowerCase()}.`}
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((request) => {
                const badge = STATUS_BADGE[request.status];
                return (
                  <li
                    key={request.id}
                    className="rounded-[14px] border border-[#d9d2bf] bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-[#1a2617]">
                        {formatMonto(request.amount)}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-[#4d6547] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="capitalize">{request.payment_method}</span>
                      <span>Informado el {formatFecha(request.created_at)}</span>
                      {request.reviewed_at && (
                        <span>Revisado el {formatFecha(request.reviewed_at)}</span>
                      )}
                      {request.file_url && (
                        <a
                          href={request.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#2d5016] font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> Ver comprobante
                        </a>
                      )}
                    </div>
                    {request.status === "rejected" && request.admin_notes && (
                      <div className="mt-2 text-xs text-[#7a3030] bg-red-50 border border-red-100 rounded-[10px] px-3 py-2">
                        Motivo del rechazo: {request.admin_notes}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
