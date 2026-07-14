"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Inbox,
  Trash2,
} from "lucide-react";
import type { AdminComplaint } from "@/lib/demo/types";

interface ReclamosFeedProps {
  initialComplaints: AdminComplaint[];
}

type FilterTab = "todos" | "pendientes" | "leidos";

const POLL_INTERVAL_MS = 8000;

const TYPE_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  consulta: { label: "Consulta", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  sugerencia: { label: "Sugerencia", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  reclamo: { label: "Reclamo", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  sugerencia_y_reclamo: {
    label: "Sugerencia + Reclamo",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  administrador: "Administrador",
  administracion: "Administración",
  coordinacion: "Coordinación",
  cuentas: "Cuentas",
  mantenimiento: "Mantenimiento",
  seguridad: "Seguridad",
  urbanismo: "Urbanismo",
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const now = Date.now();
  const diffMs = now - then;
  if (diffMs < 60_000) return "hace instantes";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ReclamosFeed({ initialComplaints }: ReclamosFeedProps) {
  const [complaints, setComplaints] = useState<AdminComplaint[]>(initialComplaints);
  const [tab, setTab] = useState<FilterTab>("pendientes");
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminComplaint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Poll for fresh data so the council sees new posts without refresh.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch("/api/admin/complaints?all=1");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.complaints)) {
          setComplaints(data.complaints);
        }
      } catch {
        /* keep stale data */
      }
    }
    refresh();
    // Pause polling while the tab is hidden.
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const counts = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status !== "read").length;
    const read = complaints.filter((c) => c.status === "read").length;
    return { total, pending, read };
  }, [complaints]);

  const visible = useMemo(() => {
    if (tab === "todos") return complaints;
    if (tab === "leidos") return complaints.filter((c) => c.status === "read");
    return complaints.filter((c) => c.status !== "read");
  }, [complaints, tab]);

  const handleAcknowledge = async (id: string) => {
    setError(null);
    setAcknowledging(id);
    try {
      const comment = comments[id]?.trim() || null;
      const response = await fetch("/api/admin/acknowledge-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: id, comment }),
      });
      const result = await response.json();
      if (!response.ok || result?.error) {
        setError(result?.error || "Error al marcar como leído");
        return;
      }
      // Optimistic local update; next poll will reconcile.
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "read",
                admin_comment: comment ?? c.admin_comment,
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
      setComments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setError("Error al marcar como leído");
    } finally {
      setAcknowledging(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    setDeleting(true);
    try {
      const response = await fetch("/api/complaints/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: deleteTarget.id }),
      });
      const result = await response.json();
      if (!response.ok || result?.error) {
        setError(result?.error || "Error al eliminar el mensaje");
        return;
      }

      setComplaints((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setComments((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });
      setDeleteTarget(null);
    } catch {
      setError("Error al eliminar el mensaje");
    } finally {
      setDeleting(false);
    }
  };

  const tabBtn = (key: FilterTab, label: string, count: number) => {
    const active = key === tab;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setTab(key)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[14px] text-[10px] font-bold uppercase tracking-wide border transition-colors ${
          active
            ? "bg-[#2d3d2a] text-[#faf6ec] border-[#2d3d2a]"
            : "bg-white text-[#4d6547] border-[#E9E2CE] hover:border-[#2d5016]/40"
        }`}
      >
        {label}
        <span
          className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-[14px] text-[10px] font-bold tabular-nums ${
            active ? "bg-[#faf6ec]/20 text-[#faf6ec]" : "bg-[#FBF8EF] text-[#4d6547]"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div data-tour-id="gestion-reclamos" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
            <MessageSquare className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase truncate">
            Consultas, sugerencias y reclamos
          </h2>
        </div>
        {counts.pending > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wide">
            {counts.pending} pendiente{counts.pending === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {tabBtn("pendientes", "Pendientes", counts.pending)}
        {tabBtn("leidos", "Leídos", counts.read)}
        {tabBtn("todos", "Todos", counts.total)}
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 space-y-2">
        {visible.length === 0 ? (
          <div className="h-full grid place-items-center text-center px-6 py-12">
            <div className="flex flex-col items-center gap-2 text-[#4d6547]">
              <div className="w-11 h-11 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE] grid place-items-center">
                <Inbox className="w-5 h-5 text-[#4d6547]" strokeWidth={1.6} />
              </div>
              <p className="text-xs">
                {tab === "pendientes"
                  ? "No hay posts pendientes."
                  : tab === "leidos"
                  ? "Aún no hay posts leídos."
                  : "Aún no hay posts."}
              </p>
            </div>
          </div>
        ) : (
          visible.map((c) => {
            const type = c.complaint_type
              ? TYPE_STYLES[c.complaint_type]
              : null;
            const isRead = c.status === "read";
            const stripeColor = isRead ? "bg-green-500" : "bg-red-500";
            return (
              <article
                key={c.id}
                className="relative rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden flex"
              >
                <div className={`w-[3px] shrink-0 ${stripeColor}`} />
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap pr-6">
                    <h3 className="text-sm font-semibold text-[#1a2617] leading-snug min-w-0 break-words">
                      {c.title || "(sin título)"}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {type && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-[14px] text-[9px] font-bold uppercase tracking-wide border ${type.bg} ${type.text} ${type.border}`}
                        >
                          {type.label}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-[14px] text-[9px] font-bold uppercase tracking-wide border ${
                          isRead
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {isRead ? "Leído" : "Pendiente"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
                    {c.profiles?.name && <span>{c.profiles.name}</span>}
                    {c.profiles?.lot && (
                      <span className="font-mono normal-case tracking-normal text-[#1a2617]">
                        Lote {c.profiles.lot}
                      </span>
                    )}
                    <span className="text-[#c9b893] normal-case tracking-normal">
                      · Para {CATEGORY_LABELS[c.category] || c.category}
                    </span>
                    <span className="text-[#c9b893] normal-case tracking-normal">
                      · {formatRelative(c.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-[#1a2617] leading-relaxed whitespace-pre-wrap break-words">
                    {c.description}
                  </p>

                  {c.admin_comment && (
                    <div className="mt-2 rounded-[14px] bg-green-50 border border-green-200 px-2.5 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-green-700 mb-0.5">
                        Respuesta de administración
                      </div>
                      <p className="text-xs text-[#1a2617] whitespace-pre-wrap break-words">
                        {c.admin_comment}
                      </p>
                    </div>
                  )}

                  <div className="mt-2 flex flex-col gap-2">
                    {!isRead && (
                      <textarea
                        value={comments[c.id] || ""}
                        onChange={(e) =>
                          setComments((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Comentario opcional al marcar como leído…"
                        rows={2}
                        className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none"
                      />
                    )}
                    <div className="flex items-center justify-end gap-2">
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(c.id)}
                          disabled={acknowledging === c.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {acknowledging === c.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Marcando…
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Marcar como leído
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* Delete action pinned to the card's top-right corner so it
                    reads as a card action, not another etiqueta. */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="absolute top-2 right-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors"
                  aria-label={`Eliminar mensaje ${c.title || "sin título"}`}
                  title="Eliminar mensaje"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </article>
            );
          })
        )}
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!deleting) setDeleteTarget(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-complaint-title"
            className="w-full max-w-sm rounded-[14px] border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-complaint-title" className="text-base font-bold text-[#1a1a1a] mb-2">
              Eliminar mensaje
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              ¿Estás seguro de que querés eliminar este mensaje?
            </p>
            <p className="text-sm font-semibold text-[#1a2617] mb-4 break-words">
              &ldquo;{deleteTarget.title || "(sin título)"}&rdquo;
            </p>
            <p className="text-xs text-red-600 mb-5">
              Esta acción elimina el registro de la base de datos y no se puede deshacer.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-[14px] border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[14px] bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando…
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
