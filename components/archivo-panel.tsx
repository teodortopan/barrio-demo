"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarRange,
  ChevronRight,
  FileText,
  FolderArchive,
  Footprints,
  UserCheck,
  Zap,
} from "lucide-react";
import { ArchivoModal } from "@/components/archivo-modal";
import { ArchivosModal } from "@/components/archivos-modal";

type FinanceView = "estado-cuenta" | "egresos" | "consumo-electrico" | "reclamos";
type SeguridadView = "ingresantes" | "recorridos" | "visitas";
type ArchiveSection<TView extends string> = {
  view: TView;
  name: string;
  blurb: string;
  icon: typeof FileText;
};

const FINANCE_SECTIONS: Array<ArchiveSection<FinanceView>> = [
  {
    view: "estado-cuenta",
    name: "Ingresos",
    blurb: "Estados de cuenta archivados mes a mes",
    icon: FileText,
  },
  {
    view: "egresos",
    name: "Egresos",
    blurb: "Salidas mensuales y reportes de cierre",
    icon: FolderArchive,
  },
  {
    view: "consumo-electrico",
    name: "Consumo eléctrico",
    blurb: "Consumos eléctricos archivados mes a mes",
    icon: Zap,
  },
  {
    view: "reclamos",
    name: "Consultas, sugerencias y reclamos",
    blurb: "Posts ya leídos por el consejo",
    icon: AlertCircle,
  },
];

const RECLAMOS_SECTION = FINANCE_SECTIONS.find(
  (section) => section.view === "reclamos"
)!;
const MONEY_SECTIONS = FINANCE_SECTIONS.filter(
  (section) => section.view !== "reclamos"
);

const SEGURIDAD_SECTIONS: Array<ArchiveSection<SeguridadView>> = [
  {
    view: "ingresantes",
    name: "Ingresantes",
    blurb: "Listados semanales de ingresos al barrio",
    icon: UserCheck,
  },
  {
    view: "recorridos",
    name: "Recorridos",
    blurb: "Vigilancia y rondas registradas",
    icon: Footprints,
  },
  {
    view: "visitas",
    name: "Visitas",
    blurb: "Histórico de visitas confirmadas y rechazadas",
    icon: CalendarRange,
  },
];

function ArchiveButton({
  section,
  onClick,
}: {
  section: ArchiveSection<string>;
  onClick: () => void;
}) {
  const Icon = section.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Abrir archivo de ${section.name}`}
      title={`Abrir archivo de ${section.name}`}
      className="w-full text-left flex items-center gap-2.5 rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5 cursor-pointer hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5016]/40 transition-colors"
    >
      <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
        <Icon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#1a2617] truncate">
          {section.name}
        </div>
        <div className="text-[10px] text-[#4d6547] truncate">
          {section.blurb}
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[#4d6547] shrink-0" />
    </button>
  );
}

export function ArchivoPanel({
  showFinanceArchive = true,
  showReclamosArchive = true,
  showSeguridadArchive = true,
}: {
  showFinanceArchive?: boolean;
  showReclamosArchive?: boolean;
  showSeguridadArchive?: boolean;
}) {
  const [openFinance, setOpenFinance] = useState<FinanceView | null>(null);
  const [openSeguridad, setOpenSeguridad] = useState<SeguridadView | null>(null);
  const financeSections = [
    ...(showFinanceArchive ? MONEY_SECTIONS : []),
    ...(showReclamosArchive ? [RECLAMOS_SECTION] : []),
  ];

  if (financeSections.length === 0 && !showSeguridadArchive) return null;

  return (
    <div data-tour-id="gestion-archivo" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          <FolderArchive className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase truncate">
          Archivo
        </h2>
        <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] hidden sm:inline">
          Histórico del barrio
        </span>
      </div>

      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3 space-y-3">
        {financeSections.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
              Cuentas y comunidad
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {financeSections.map((section) => (
                <ArchiveButton
                  key={section.view}
                  section={section}
                  onClick={() => setOpenFinance(section.view)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Seguridad */}
        {showSeguridadArchive && (
          <div
            className={
              "pt-1" +
              (financeSections.length > 0
                ? " border-t border-dashed border-[#E9E2CE]"
                : "")
            }
          >
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mt-2 mb-2">
              Seguridad
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SEGURIDAD_SECTIONS.map((section) => (
                <ArchiveButton
                  key={section.view}
                  section={section}
                  onClick={() => setOpenSeguridad(section.view)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ArchivoModal
        isOpen={openFinance !== null}
        onClose={() => setOpenFinance(null)}
        initialView={openFinance ?? "menu"}
        allowedViews={financeSections.map((section) => section.view)}
      />
      <ArchivosModal
        isOpen={openSeguridad !== null}
        onClose={() => setOpenSeguridad(null)}
        initialView={openSeguridad ?? "main"}
      />
    </div>
  );
}
