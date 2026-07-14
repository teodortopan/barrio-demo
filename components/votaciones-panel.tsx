"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Vote, Plus, ThumbsUp, ThumbsDown, X, Trash2, Loader2 } from "lucide-react";
import { roleDisplayName } from "@/lib/auth/permissions";

interface Votacion {
  id: string;
  title: string;
  description: string;
  closed: boolean;
  created_at: string;
  mine: boolean;
  can_delete: boolean;
  author_name: string;
  author_role: string | null;
  votes_si: number;
  votes_no: number;
  total: number;
  my_choice: "si" | "no" | null;
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

function applyVoteChoice(v: Votacion, next: "si" | "no" | null): Votacion {
  const prev = v.my_choice;
  if (prev === next) return v;

  const votesSi =
    v.votes_si + (prev === "si" ? -1 : 0) + (next === "si" ? 1 : 0);
  const votesNo =
    v.votes_no + (prev === "no" ? -1 : 0) + (next === "no" ? 1 : 0);

  return {
    ...v,
    my_choice: next,
    votes_si: Math.max(0, votesSi),
    votes_no: Math.max(0, votesNo),
    total: Math.max(0, votesSi) + Math.max(0, votesNo),
  };
}

function Shell({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div data-tour-id="comunidad-votaciones" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col self-start">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
            <Vote className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
            Votaciones
          </h2>
        </div>
        {typeof count === "number" && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
            {count} {count === 1 ? "tema" : "temas"}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function VotacionesPanel() {
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [canVote, setCanVote] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingIds, setVotingIds] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/votaciones", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo cargar");
        return;
      }
      setVotaciones(data.votaciones || []);
      setCanVote(!!data.can_vote);
      setCanCreate(!!data.can_create);
      setError(null);
    } catch (err) {
      console.error("load votaciones error:", err);
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVote = async (id: string, current: "si" | "no" | null, choice: "si" | "no") => {
    const next = current === choice ? null : choice;
    const previous = votaciones.find((v) => v.id === id);
    if (!previous) return;

    setVotingIds((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(id);
      return nextSet;
    });
    setVotaciones((rows) =>
      rows.map((v) => (v.id === id ? applyVoteChoice(v, next) : v))
    );

    try {
      const res = await fetch("/api/votaciones/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votacion_id: id, choice: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVotaciones((rows) =>
          rows.map((v) => (v.id === id ? previous : v))
        );
        alert(data.error || "No se pudo registrar tu voto");
        return;
      }
    } catch {
      setVotaciones((rows) =>
        rows.map((v) => (v.id === id ? previous : v))
      );
      alert("Error de red al votar");
    } finally {
      setVotingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(id);
        return nextSet;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta votación?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/votaciones/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "No se pudo eliminar");
        return;
      }
      await load();
    } catch {
      alert("Error de red");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-4 space-y-2 h-[288px] sm:h-[392px]">
          <div className="h-3 w-2/3 rounded bg-[#E9E2CE] animate-pulse" />
          <div className="h-3 w-full rounded bg-[#E9E2CE] animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-[#E9E2CE] animate-pulse" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="flex items-center justify-center rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center h-[288px] sm:h-[392px]">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </Shell>
    );
  }

  return (
    <>
      <Shell count={votaciones.length}>
        <div className="flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
          <div className="overflow-y-auto pr-1 p-3 space-y-2 h-[240px] sm:h-[340px]">
            {votaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10 mb-3">
                  <Vote className="w-5 h-5 text-[#2d5016]" strokeWidth={2} />
                </div>
                <p className="text-sm font-medium text-[#1a2617]">No hay votaciones activas</p>
                {canCreate && (
                  <p className="text-xs text-[#4d6547] mt-1">
                    Sé el primero en proponer un tema
                  </p>
                )}
              </div>
            ) : (
              votaciones.map((v) => {
                const total = v.total;
                const siPct = total > 0 ? Math.round((v.votes_si / total) * 100) : 0;
                const noPct = total > 0 ? 100 - siPct : 0;
                const isVoting = votingIds.has(v.id);
                return (
                  <div
                    key={v.id}
                    className="rounded-[14px] bg-white border border-[#E9E2CE] p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-[#1a2617] flex-1 min-w-0">
                        {v.title}
                      </h3>
                      {v.can_delete && (
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deleting === v.id}
                          className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Eliminar votación"
                        >
                          {deleting === v.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {v.description && (
                      <p className="text-[12px] text-[#3c3c3c] leading-relaxed whitespace-pre-wrap break-words mb-2">
                        {v.description}
                      </p>
                    )}

                    {/* Vote buttons */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        data-demo-mutation
                        type="button"
                        disabled={!canVote || v.closed || isVoting}
                        onClick={() => handleVote(v.id, v.my_choice, "si")}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[14px] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          v.my_choice === "si"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-white text-[#2d5016] border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF]"
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} />
                        Sí · {v.votes_si}
                      </button>
                      <button
                        data-demo-mutation
                        type="button"
                        disabled={!canVote || v.closed || isVoting}
                        onClick={() => handleVote(v.id, v.my_choice, "no")}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[14px] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          v.my_choice === "no"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-white text-[#8b6f47] border border-[#E9E2CE] hover:border-red-300 hover:bg-red-50/40"
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} />
                        No · {v.votes_no}
                      </button>
                    </div>

                    {/* Result bar */}
                    {total > 0 && (
                      <div className="flex h-1.5 w-full rounded-[14px] overflow-hidden bg-[#E9E2CE]">
                        <div
                          style={{ width: `${siPct}%` }}
                          className="bg-green-600"
                          title={`Sí: ${siPct}%`}
                        />
                        <div
                          style={{ width: `${noPct}%` }}
                          className="bg-red-500"
                          title={`No: ${noPct}%`}
                        />
                      </div>
                    )}

                    {/* Footer: author + time */}
                    <div className="mt-2 pt-2 border-t border-dashed border-[#E9E2CE] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#4d6547] min-w-0">
                        <span className="shrink-0">De parte de</span>
                        <span className="truncate font-medium text-[#1a2617]">{v.author_name}</span>
                        {v.author_role && (
                          <span className="px-1.5 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-medium whitespace-nowrap">
                            {roleDisplayName(v.author_role)}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-[#4d6547]">
                        {formatRelative(v.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {canCreate && (
            <div className="shrink-0 px-3 py-2.5 border-t border-dashed border-[#E9E2CE] bg-white">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Proponer un tema
              </button>
            </div>
          )}
          {!canCreate && (
            <div className="shrink-0 px-3 py-2.5 border-t border-dashed border-[#E9E2CE] bg-white text-center">
              <p className="text-[11px] text-[#4d6547]">
                Iniciá sesión para proponer y votar.
              </p>
            </div>
          )}
        </div>
      </Shell>

      {createOpen && (
        <CreateVotacionModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await load();
          }}
        />
      )}
    </>
  );
}

function CreateVotacionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, submitting]);

  const submit = async () => {
    if (!title.trim()) {
      setError("El título no puede estar vacío");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/votaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear");
        return;
      }
      onCreated();
    } catch {
      setError("Error de red al crear");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const node = (
    <div
      onClick={() => !submitting && onClose()}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden"
      >
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <Vote className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Comunidad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Nueva votación
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-[#3c3c3c] leading-relaxed">
            Proponé un tema para que el resto del barrio pueda votar Sí o No.
          </p>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. ¿Sumamos un cesto de reciclaje en la entrada?"
              className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
              Descripción <span className="text-[#c9b893] font-medium tracking-normal normal-case">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Explicá un poco más el contexto…"
              className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none"
              maxLength={2000}
            />
          </div>

          {error && (
            <div className="rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !title.trim()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors ${
                submitting || !title.trim()
                  ? "bg-[#ede4d2] text-[#c9b893] cursor-not-allowed"
                  : "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
              }`}
            >
              {submitting ? "Publicando…" : "Publicar votación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
