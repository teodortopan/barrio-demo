"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Clock, UserCheck, X, MessageSquare, Loader2 } from "lucide-react";

interface Visit {
  id: string;
  visitor_name: string;
  visitor_dni: string;
  visit_date: string;
  visit_time: string;
  license_plate: string | null;
  relationship: string;
  notes: string | null;
  status: string;
  created_at: string;
  guard_comment?: string | null;
  profiles: {
    name: string;
    lot: string;
  } | null;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  familiar: "Familiar",
  amigo: "Amigo",
  proveedor: "Proveedor/Servicio",
  trabajo: "Trabajo",
  otro: "Otro",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(timeString: string): string {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":");
  return `${hours}:${minutes}hs`;
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diffMs = Math.max(0, Date.now() - t);
  if (diffMs < 60_000) return "hace instantes";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

function StatusPill({ status }: { status: string }) {
  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[14px] bg-green-50 text-green-700 text-[10px] font-semibold whitespace-nowrap">
        <CheckCircle className="w-3 h-3" />
        Leída
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[14px] bg-orange-50 text-orange-600 text-[10px] font-semibold whitespace-nowrap">
      <Clock className="w-3 h-3" />
      Pendiente
    </span>
  );
}

// Locks the visible area of the cream card so additional requests scroll
// inline instead of growing the panel. Matches the Estado actual height in
// Mi panel for visual consistency.
const SCROLL_HEIGHT = "h-[150px]";

export function VisitasSection() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Visit | null>(null);

  const fetchVisits = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/visits");
      const result = await res.json().catch(() => ({}));

      if (!res.ok || result.error) {
        throw new Error(result.error || "No se pudieron cargar las solicitudes");
      }

      setVisits(result.visits || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching visits:", err);
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
    // Pause polling while the tab is hidden.
    const interval = setInterval(() => {
      if (!document.hidden) fetchVisits();
    }, 30_000);
    const handleVisibility = () => {
      if (!document.hidden) fetchVisits();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchVisits]);

  const pendingCount = visits.filter((v) => v.status !== "read").length;

  return (
    <>
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2d5016]">
            Solicitudes
          </span>
          {!loading && visits.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`
                : `${visits.length} total`}
            </span>
          )}
        </div>
        <div className="border-t border-dashed border-[#E9E2CE] px-3 py-3">
          {error && !loading && (
            <div className="mb-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchVisits}
                className="shrink-0 font-semibold text-red-800 hover:text-red-900"
              >
                Reintentar
              </button>
            </div>
          )}
          {loading ? (
            <div className={`flex items-center justify-center ${SCROLL_HEIGHT}`}>
              <p className="text-xs text-[#4d6547]">Cargando…</p>
            </div>
          ) : error && visits.length === 0 ? (
            <div className={`flex items-center justify-center text-center px-4 ${SCROLL_HEIGHT}`}>
              <p className="text-xs text-[#4d6547]">Reintentá para ver las solicitudes pendientes.</p>
            </div>
          ) : visits.length === 0 ? (
            <div className={`flex items-center justify-center ${SCROLL_HEIGHT}`}>
              <p className="text-xs text-[#4d6547]">Sin solicitudes</p>
            </div>
          ) : (
            <div className={`space-y-2 overflow-y-auto pr-1 ${SCROLL_HEIGHT}`}>
              {visits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => setSelected(visit)}
                  className="w-full text-left rounded-[14px] bg-white border border-[#E9E2CE] p-2.5 hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1a2617] truncate">
                        {visit.visitor_name}
                      </p>
                      <p className="text-[10px] text-[#3c3c3c] mt-0.5">
                        {formatDate(visit.visit_date)} · {formatTime(visit.visit_time)}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {RELATIONSHIP_LABELS[visit.relationship] || visit.relationship}
                        {visit.license_plate && ` • Patente: ${visit.license_plate}`}
                      </p>
                    </div>
                    <StatusPill status={visit.status} />
                  </div>
                  <div className="mt-1 pt-1 border-t border-dashed border-[#E9E2CE] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#4d6547] min-w-0">
                      <span className="shrink-0">De parte de</span>
                      <span className="truncate font-medium text-[#1a2617]">
                        {visit.profiles?.name || "Vecino"}
                      </span>
                      {visit.profiles?.lot && (
                        <span className="px-1.5 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-medium whitespace-nowrap">
                          Lote {visit.profiles.lot}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-[#4d6547]">
                      {formatRelative(visit.created_at)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <VisitaDetailModal
          visit={selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await fetchVisits();
          }}
        />
      )}
    </>
  );
}

function VisitaDetailModal({
  visit,
  onClose,
  onSaved,
}: {
  visit: Visit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [comment, setComment] = useState(visit.guard_comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, saving]);

  const handleAcknowledge = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/acknowledge-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, comment: comment.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        setError(data.error || "No se pudo autorizar la visita");
        return;
      }
      onSaved();
    } catch {
      setError("Error de red al autorizar la visita");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  const node = (
    <div
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[85vh] bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE] shrink-0"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <UserCheck className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Solicitud de visita
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 truncate">
              {visit.visitor_name}
            </h2>
          </div>
          <StatusPill status={visit.status} />
          <button
            onClick={onClose}
            disabled={saving}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Detalles */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
              Datos del visitante
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Nombre" value={visit.visitor_name} />
              <Field label="DNI" value={visit.visitor_dni} mono />
              <Field label="Fecha" value={formatDate(visit.visit_date)} />
              <Field label="Hora" value={formatTime(visit.visit_time)} />
              <Field
                label="Relación"
                value={RELATIONSHIP_LABELS[visit.relationship] || visit.relationship}
              />
              <Field
                label="Patente"
                value={visit.license_plate || "—"}
                mono
              />
            </div>
          </div>

          {visit.notes && (
            <div className="rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1">
                Notas del residente
              </div>
              <p className="text-[12px] text-[#1a2617] leading-relaxed whitespace-pre-wrap break-words">
                {visit.notes}
              </p>
            </div>
          )}

          {/* Quién la pidió */}
          <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE] px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                De parte de
              </span>
              <span className="text-sm font-medium text-[#1a2617] truncate">
                {visit.profiles?.name || "Vecino"}
              </span>
            </div>
            {visit.profiles?.lot && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[11px] font-medium whitespace-nowrap">
                Lote {visit.profiles.lot}
              </span>
            )}
          </div>

          {/* Comentario de seguridad */}
          {visit.status !== "read" ? (
            <div>
              <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
                Comentario de seguridad{" "}
                <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                  (opcional)
                </span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Detalle que el residente debería saber al autorizar la visita…"
                className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none"
              />
            </div>
          ) : (
            visit.guard_comment && (
              <div className="rounded-[14px] bg-[#2d5016]/5 border border-[#2d5016]/15 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-medium text-[#2d5016] mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Comentario de seguridad
                </div>
                <p className="text-[12px] text-[#1a2617] leading-relaxed whitespace-pre-wrap break-words">
                  {visit.guard_comment}
                </p>
              </div>
            )
          )}

          {error && (
            <div className="rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-dashed border-[#E9E2CE]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
          >
            {visit.status === "read" ? "Cerrar" : "Cancelar"}
          </button>
          {visit.status !== "read" && (
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Autorizar visita
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-0.5">
        {label}
      </div>
      <div className={`text-[13px] text-[#1a2617] ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}
