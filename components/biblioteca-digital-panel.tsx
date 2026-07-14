"use client";

import { useMemo, useState } from "react";
import { Map, FileText, Archive, Upload, ChevronRight } from "lucide-react";
import type { BibliotecaFile, AsambleaFile } from "@/lib/demo/types";
import { BibliotecaDigitalModal } from "@/components/biblioteca-digital-modal";

type DocType = "plano" | "reglamento" | "asamblea";

interface BibliotecaDigitalPanelProps {
  initialBibliotecaFiles: BibliotecaFile[];
  initialAsambleaFiles: AsambleaFile[];
  canEdit: boolean;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  if (diffMs < 60_000) return "hace instantes";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function BibliotecaDigitalPanel({
  initialBibliotecaFiles,
  initialAsambleaFiles,
  canEdit,
}: BibliotecaDigitalPanelProps) {
  const [openType, setOpenType] = useState<DocType | null>(null);

  const planoFile = useMemo(
    () => initialBibliotecaFiles.find((f) => f.document_type === "plano") ?? null,
    [initialBibliotecaFiles]
  );
  const reglamentoFile = useMemo(
    () => initialBibliotecaFiles.find((f) => f.document_type === "reglamento") ?? null,
    [initialBibliotecaFiles]
  );
  const asambleaCount = initialAsambleaFiles.length;
  const latestAsamblea = initialAsambleaFiles[0] ?? null;

  const rows: Array<{
    type: DocType;
    name: string;
    icon: typeof Map;
    status: string;
    available: boolean;
  }> = [
    {
      type: "plano",
      name: "Plano de los lotes",
      icon: Map,
      status: planoFile
        ? `Actualizado ${formatRelative(planoFile.updated_at)}`
        : "No cargado",
      available: !!planoFile,
    },
    {
      type: "reglamento",
      name: "Reglamento aprobado",
      icon: FileText,
      status: reglamentoFile
        ? `Actualizado ${formatRelative(reglamentoFile.updated_at)}`
        : "No cargado",
      available: !!reglamentoFile,
    },
    {
      type: "asamblea",
      name: "Actas de asamblea",
      icon: Archive,
      status:
        asambleaCount === 0
          ? "No hay actas"
          : `${asambleaCount} acta${asambleaCount === 1 ? "" : "s"} cargada${
              asambleaCount === 1 ? "" : "s"
            } · última ${formatRelative(latestAsamblea!.created_at)}`,
      available: asambleaCount > 0,
    },
  ];

  return (
    <>
      <div data-tour-id="gestion-biblioteca" className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2d5016]">
            Biblioteca digital
          </div>
          {canEdit && (
            <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Tocá para subir o reemplazar
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {rows.map((row) => {
            const Icon = row.icon;
            const Wrapper = canEdit ? "button" : "div";
            const wrapperProps = canEdit
              ? {
                  type: "button" as const,
                  onClick: () => setOpenType(row.type),
                  "aria-label": `Subir o reemplazar ${row.name}`,
                  title: "Tocá para subir o reemplazar",
                }
              : {};
            return (
              <Wrapper
                key={row.type}
                {...wrapperProps}
                className={`w-full text-left flex items-center gap-2.5 rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5 transition-colors ${
                  canEdit
                    ? "cursor-pointer hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5016]/40"
                    : ""
                }`}
              >
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <Icon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1a2617] truncate">
                    {row.name}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      row.available ? "text-[#4d6547]" : "text-[#c9b893] italic"
                    }`}
                  >
                    {row.status}
                  </div>
                </div>
                {canEdit ? (
                  <Upload className="w-3.5 h-3.5 text-[#4d6547] shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#4d6547] shrink-0" />
                )}
              </Wrapper>
            );
          })}
        </div>
      </div>

      {canEdit && (
        <BibliotecaDigitalModal
          isOpen={openType !== null}
          onClose={() => setOpenType(null)}
          initialDocumentType={openType ?? undefined}
        />
      )}
    </>
  );
}
