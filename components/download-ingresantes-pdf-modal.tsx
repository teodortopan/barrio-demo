"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface DownloadIngresantesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadIngresantesPdfModal({ isOpen, onClose }: DownloadIngresantesPdfModalProps) {
  const [saveToArchivos, setSaveToArchivos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/seguridad/ingresantes/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToArchivos }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al generar el PDF");
      }

      if (result.pdfUrl) {
        const link = document.createElement("a");
        link.href = result.pdfUrl;
        link.download = result.filename || "ingresantes.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSaveToArchivos(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <Download className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Seguridad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Descargar PDF
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="flex items-center gap-2.5 cursor-pointer rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5 hover:border-[#2d5016]/40 transition-colors">
            <input
              type="checkbox"
              checked={saveToArchivos}
              onChange={(e) => setSaveToArchivos(e.target.checked)}
              className="w-4 h-4 text-[#2d5016] border-[#E9E2CE] rounded focus:ring-[#2d5016]/40"
              disabled={loading}
            />
            <span className="text-xs text-[#1a2617]">
              Guardar copia en Archivos → Ingresantes
            </span>
          </label>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>PDF descargado exitosamente</span>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-dashed border-[#E9E2CE]">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generando…
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
