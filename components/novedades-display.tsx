"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

interface Novedad {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface NovedadesDisplayProps {
  initialReminders?: Novedad[];
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div data-tour-id="comunidad-novedades" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col self-start">
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          <Bell className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Novedades
        </h2>
      </div>
      {children}
    </div>
  );
}

function formatRelative(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function NovedadesDisplay({ initialReminders }: NovedadesDisplayProps) {
  const [novedades, setNovedades] = useState<Novedad[]>(initialReminders || []);
  const [loading, setLoading] = useState(!initialReminders);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialReminders) return;
    async function fetchNovedades() {
      try {
        const response = await fetch("/api/reminders?type=novedad");
        const result = await response.json();

        if (result.error) {
          console.error("Error fetching novedades:", result.error);
        } else {
          setNovedades(result.reminders || []);
        }
      } catch (error) {
        console.error("Error fetching novedades:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNovedades();
  }, [initialReminders]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl]);

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

  if (novedades.length === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center h-[288px] sm:h-[392px]">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10 mb-3">
            <Bell className="w-5 h-5 text-[#2d5016]" strokeWidth={2} />
          </div>
          <p className="text-sm font-medium text-[#1a2617]">No hay novedades esta semana</p>
        </div>
      </Shell>
    );
  }

  return (
    <>
      <Shell>
        <div className="flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
          <div className="overflow-y-auto pr-1 p-3 space-y-2 h-[288px] sm:h-[392px]">
            {novedades.map((novedad) => (
              <div
                key={novedad.id}
                className="rounded-[14px] bg-white border border-[#E9E2CE] p-3"
              >
                <h3 className="text-sm font-semibold text-[#1a2617] mb-1.5">
                  {novedad.title}
                </h3>
                {novedad.image_url && (
                  <button
                    onClick={() => setLightboxUrl(novedad.image_url)}
                    className="mb-2 w-full block rounded-[14px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#2d5016]/40 cursor-zoom-in border border-[#E9E2CE]"
                    title="Click para ver imagen completa"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={novedad.image_url}
                      alt={novedad.title}
                      className="w-full max-h-32 sm:max-h-48 object-cover"
                    />
                  </button>
                )}
                <p className="text-sm text-[#3c3c3c] leading-relaxed whitespace-pre-wrap break-words">
                  {novedad.content}
                </p>
                <div className="mt-2 pt-2 border-t border-dashed border-[#E9E2CE] flex items-center justify-end">
                  <span className="text-[10px] text-[#4d6547]">
                    {formatRelative(novedad.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Shell>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.85)", backdropFilter: "blur(6px)" }}
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-white/90 text-[#4d6547] hover:bg-white transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Imagen completa"
            className="max-w-full max-h-[90vh] rounded-[14px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
