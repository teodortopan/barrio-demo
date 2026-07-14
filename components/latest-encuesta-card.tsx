"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vote, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

interface Votacion {
  id: string;
  title: string;
  description: string;
  closed: boolean;
  created_at: string;
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-tour-id="activo-comunidad" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 h-full w-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          <Vote className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Activo en comunidad
        </h2>
      </div>
      {children}
    </div>
  );
}

export function LatestEncuestaCard() {
  const [votacion, setVotacion] = useState<Votacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/votaciones");
        if (!res.ok) return;
        const data = await res.json();
        const list: Votacion[] = data.votaciones || [];
        const open = list.find((v) => !v.closed);
        if (!cancelled) setVotacion(open ?? null);
      } catch {
        // Swallow — empty state will render.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function vote(choice: "si" | "no") {
    if (!votacion || submitting) return;
    const next = votacion.my_choice === choice ? null : choice;
    setSubmitting(true);
    try {
      const res = await fetch("/api/votaciones/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votacion_id: votacion.id, choice: next }),
      });
      if (!res.ok) return;
      setVotacion((v) => {
        if (!v) return v;
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
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Shell>
        <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
          <div className="flex-1 p-4 space-y-2">
            <div className="h-3 w-2/3 rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-3 w-5/6 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </Shell>
    );
  }

  if (!votacion) {
    return (
      <Shell>
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10 mb-3">
            <Vote className="w-5 h-5 text-[#2d5016]" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[#1a1a1a]">
            No hay encuestas abiertas
          </p>
          <Link
            href="/comunidad"
            className="mt-3 text-xs text-[#2d5016] hover:underline"
          >
            Ver todas →
          </Link>
        </div>
      </Shell>
    );
  }

  const relative = formatRelative(votacion.created_at);
  const totalPct =
    votacion.total > 0
      ? Math.round((votacion.votes_si / votacion.total) * 100)
      : 0;

  return (
    <Shell>
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="flex flex-1 min-h-0">
          <div className="w-[3px] shrink-0 bg-[#2d5016] rounded-l-[14px]" />
          <div className="flex-1 min-w-0 flex flex-col p-4">
            <h3 className="text-base font-semibold text-[#1a1a1a] leading-snug shrink-0">
              {votacion.title}
            </h3>
            {votacion.description && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 mt-2">
                <p className="text-sm text-[#3c3c3c] leading-relaxed whitespace-pre-wrap break-words">
                  {votacion.description}
                </p>
              </div>
            )}

            <div className="mt-3 shrink-0">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold mb-1">
                <span className="text-[#2d5016]">Sí · {votacion.votes_si}</span>
                <span className="text-[#4d6547]">
                  {votacion.total} {votacion.total === 1 ? "voto" : "votos"}
                </span>
                <span className="text-red-700">
                  {votacion.votes_no} · No
                </span>
              </div>
              {votacion.total > 0 && (
                <div className="h-1.5 w-full rounded-full overflow-hidden bg-red-200 flex">
                  <div
                    className="h-full bg-[#2d5016]"
                    style={{ width: `${totalPct}%` }}
                  />
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2 shrink-0">
              <button
                data-demo-mutation
                onClick={() => vote("si")}
                disabled={submitting}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-semibold transition-colors ${
                  votacion.my_choice === "si"
                    ? "bg-[#2d5016] text-[#faf6ec]"
                    : "bg-white text-[#2d5016] border border-[#E9E2CE] hover:bg-[#2d5016]/5"
                } disabled:opacity-50`}
              >
                {submitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ThumbsUp className="w-3 h-3" strokeWidth={2} />
                )}
                Sí
              </button>
              <button
                data-demo-mutation
                onClick={() => vote("no")}
                disabled={submitting}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-semibold transition-colors ${
                  votacion.my_choice === "no"
                    ? "bg-red-600 text-white"
                    : "bg-white text-red-700 border border-[#E9E2CE] hover:bg-red-50"
                } disabled:opacity-50`}
              >
                {submitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ThumbsDown className="w-3 h-3" strokeWidth={2} />
                )}
                No
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-t border-dashed border-[#E9E2CE]">
          <Link
            href="/comunidad"
            className="text-xs text-[#2d5016] hover:underline"
          >
            Ver todas →
          </Link>
          <span className="shrink-0 text-xs text-gray-500">{relative}</span>
        </div>
      </div>
    </Shell>
  );
}
