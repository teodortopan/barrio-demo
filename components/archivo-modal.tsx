"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, AlertCircle, ArrowLeft, ChevronRight, Zap } from "lucide-react";
import { EstadoCuentaView } from "./estado-cuenta-view";
import { EgresosArchivoView } from "./egresos-archivo-view";
import { ConsumoElectricoArchivoView } from "./consumo-electrico-archivo-view";
import { ReclamosArchivoView } from "./reclamos-archivo-view";

type ArchivoView = "menu" | "estado-cuenta" | "egresos" | "consumo-electrico" | "reclamos";
type ArchivoContentView = Exclude<ArchivoView, "menu">;

interface ArchivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: ArchivoView;
  allowedViews?: ArchivoContentView[];
}

const DEFAULT_ARCHIVO_VIEWS: ArchivoContentView[] = [
  "estado-cuenta",
  "egresos",
  "consumo-electrico",
  "reclamos",
];

export function ArchivoModal({
  isOpen,
  onClose,
  initialView = "menu",
  allowedViews = DEFAULT_ARCHIVO_VIEWS,
}: ArchivoModalProps) {
  const [selectedView, setSelectedView] = useState<ArchivoView>(initialView);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedView(
        initialView === "menu" || allowedViews.includes(initialView)
          ? initialView
          : "menu"
      );
    }
  }, [allowedViews, isOpen, initialView]);

  if (!isOpen || !mounted) return null;

  const handleBackToMenu = () => {
    setSelectedView("menu");
  };

  const headerTitle =
    selectedView === "menu"
      ? "Archivo"
      : selectedView === "estado-cuenta"
      ? "Ingresos"
      : selectedView === "egresos"
      ? "Egresos"
      : selectedView === "consumo-electrico"
      ? "Consumo eléctrico"
      : "Consultas, sugerencias y reclamos";

  const node = (
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
            <FileText className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Archivo
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              {headerTitle}
            </h2>
          </div>
          {selectedView !== "menu" && (
            <button
              onClick={handleBackToMenu}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[14px] text-xs font-medium text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>
          )}
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
          {selectedView === "menu" && (
            <div className="space-y-2">
              {allowedViews.includes("estado-cuenta") && (
                <button
                  onClick={() => setSelectedView("estado-cuenta")}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <FileText className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                        Estados de cuenta
                      </div>
                      <div className="text-sm font-semibold text-[#1a2617]">Ingresos</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4d6547]" />
                </button>
              )}
              {allowedViews.includes("egresos") && (
                <button
                  onClick={() => setSelectedView("egresos")}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <FileText className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                        Salidas
                      </div>
                      <div className="text-sm font-semibold text-[#1a2617]">Egresos</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4d6547]" />
                </button>
              )}
              {allowedViews.includes("consumo-electrico") && (
                <button
                  onClick={() => setSelectedView("consumo-electrico")}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <Zap className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                        Servicios
                      </div>
                      <div className="text-sm font-semibold text-[#1a2617]">Consumo eléctrico</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4d6547]" />
                </button>
              )}
              {allowedViews.includes("reclamos") && (
                <button
                  onClick={() => setSelectedView("reclamos")}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                      <AlertCircle className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                        Comunidad
                      </div>
                      <div className="text-sm font-semibold text-[#1a2617]">
                        Consultas, sugerencias y reclamos
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#4d6547]" />
                </button>
              )}
            </div>
          )}

          {selectedView === "estado-cuenta" && <EstadoCuentaView />}
          {selectedView === "egresos" && <EgresosArchivoView />}
          {selectedView === "consumo-electrico" && <ConsumoElectricoArchivoView />}
          {selectedView === "reclamos" && <ReclamosArchivoView />}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
