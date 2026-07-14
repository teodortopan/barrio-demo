"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, ChevronLeft, Folder, Loader2, Download, Users } from "lucide-react";

interface IngresantesFile {
  id: string;
  filename: string;
  file_url: string;
  month: string;
  year: number;
  week: number;
  created_at: string;
}

interface RecorridosFile {
  id: string;
  filename: string;
  file_url: string;
  date: string;
  created_at: string;
}

interface ArchivedVisit {
  id: string;
  visitor_name: string;
  visitor_dni: string;
  visit_date: string;
  visit_time: string;
  license_plate: string | null;
  relationship: string;
  notes: string | null;
  guard_comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  resident_name: string;
  resident_lot: string;
}

interface ArchivosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewType = "main" | "ingresantes" | "recorridos" | "visitas";
type NavigationLevel = "year" | "month" | "date" | "files";

interface ArchivosModalExtraProps {
  initialView?: ViewType;
}

export function ArchivosModal({
  isOpen,
  onClose,
  initialView = "main",
}: ArchivosModalProps & ArchivosModalExtraProps) {
  const [view, setView] = useState<ViewType>(initialView);
  const [ingresantesFiles, setIngresantesFiles] = useState<IngresantesFile[]>([]);
  const [recorridosFiles, setRecorridosFiles] = useState<RecorridosFile[]>([]);
  const [archivedVisits, setArchivedVisits] = useState<ArchivedVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveWarning, setArchiveWarning] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Navigation state
  const [navLevel, setNavLevel] = useState<NavigationLevel>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllFiles();
      // Reset navigation when modal opens; honor initialView if provided.
      setView(initialView);
      setNavLevel("year");
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDate(null);
    }
  }, [isOpen, initialView]);

  async function fetchAllFiles() {
    setLoading(true);
    setError(null);
    setArchiveWarning(null);
    try {
      const [ingresantesRes, recorridosRes, visitsRes] = await Promise.all([
        fetch("/api/seguridad/ingresantes/files"),
        fetch("/api/seguridad/recorridos/files"),
        fetch("/api/seguridad/visits-archive"),
      ]);

      const ingresantesResult = await ingresantesRes.json().catch(() => ({}));
      const recorridosResult = await recorridosRes.json().catch(() => ({}));
      const visitsResult = await visitsRes.json().catch(() => ({}));
      const failedSections: string[] = [];

      if (!ingresantesRes.ok || ingresantesResult.error) {
        console.error("Error fetching ingresantes files:", ingresantesResult.error || ingresantesRes.statusText);
        failedSections.push("Ingresantes");
      } else {
        setIngresantesFiles(ingresantesResult.files || []);
      }

      if (!recorridosRes.ok || recorridosResult.error) {
        console.error("Error fetching recorridos files:", recorridosResult.error || recorridosRes.statusText);
        failedSections.push("Recorridos");
      } else {
        setRecorridosFiles(recorridosResult.files || []);
      }

      if (!visitsRes.ok || visitsResult.error) {
        console.error("Error fetching archived visits:", visitsResult.error || visitsRes.statusText);
        failedSections.push("Visitas");
      } else {
        setArchivedVisits(visitsResult.visits || []);
      }

      if (failedSections.length === 3) {
        setError("Error al cargar los archivos");
      } else if (failedSections.length > 0) {
        setArchiveWarning(`No se pudieron cargar: ${failedSections.join(", ")}.`);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Error al cargar los archivos");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (fileId: string, filename: string, fileType: "ingresantes" | "recorridos") => {
    if (!confirm(`¿Estás seguro de que querés eliminar "${filename}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingId(fileId);
    try {
      const endpoint = fileType === "ingresantes"
        ? `/api/seguridad/ingresantes/files/${fileId}`
        : `/api/seguridad/recorridos/files/${fileId}`;
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al eliminar");
      if (fileType === "ingresantes") {
        setIngresantesFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        setRecorridosFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (e) {
      console.error("Error deleting file:", e);
      alert(e instanceof Error ? e.message : "Error al eliminar el archivo");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Parse "YYYY-MM-DD" without timezone shift (new Date("2026-03-01") parses as UTC,
  // which in UTC-3 becomes Feb 28 — causing wrong month/year in folder navigation)
  const parseDateStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  };

  // Get unique years from files
  const getYears = (files: (IngresantesFile | RecorridosFile)[]) => {
    const years = new Set<number>();
    files.forEach(file => {
      if ('year' in file) {
        years.add(file.year);
      } else if ('date' in file) {
        years.add(parseDateStr(file.date).year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Get unique months for a year
  const getMonths = (year: number, files: (IngresantesFile | RecorridosFile)[]) => {
    const months = new Set<string>();
    files.forEach(file => {
      if ('year' in file && file.year === year) {
        months.add(file.month);
      } else if ('date' in file) {
        const parsed = parseDateStr(file.date);
        if (parsed.year === year) {
          const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
          ];
          months.add(monthNames[parsed.month]);
        }
      }
    });
    return Array.from(months).sort((a, b) => {
      const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });
  };

  // Get unique dates for a year and month (only for recorridos)
  const getDates = (year: number, month: string, files: RecorridosFile[]) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthIndex = monthNames.indexOf(month);

    const dates = new Set<string>();
    files.forEach(file => {
      const parsed = parseDateStr(file.date);
      if (parsed.year === year && parsed.month === monthIndex) {
        dates.add(file.date);
      }
    });

    return Array.from(dates).sort((a, b) => {
      return b.localeCompare(a); // Most recent first (YYYY-MM-DD sorts lexically)
    });
  };

  // Get filtered files based on navigation
  const getFilteredFiles = () => {
    if (view === "ingresantes") {
      let filtered = ingresantesFiles;
      if (selectedYear) {
        filtered = filtered.filter(f => f.year === selectedYear);
      }
      if (selectedMonth) {
        filtered = filtered.filter(f => f.month === selectedMonth);
      }
      return filtered;
    } else if (view === "recorridos") {
      let filtered = recorridosFiles;
      if (selectedYear) {
        filtered = filtered.filter(f => parseDateStr(f.date).year === selectedYear);
      }
      if (selectedMonth) {
        const monthNames = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const monthIndex = monthNames.indexOf(selectedMonth);
        filtered = filtered.filter(f => parseDateStr(f.date).month === monthIndex);
      }
      if (selectedDate) {
        filtered = filtered.filter(f => f.date === selectedDate);
      }
      return filtered;
    }
    return [];
  };

  const handleBack = () => {
    if (navLevel === "files") {
      if (view === "recorridos" && selectedDate) {
        setSelectedDate(null);
        setNavLevel("month");
      } else if (selectedMonth) {
        setSelectedMonth(null);
        setNavLevel("year");
      } else if (selectedYear) {
        setSelectedYear(null);
        setNavLevel("year");
      }
    } else if (navLevel === "date") {
      setSelectedDate(null);
      setNavLevel("month");
    } else if (navLevel === "month") {
      setSelectedMonth(null);
      setNavLevel("year");
    } else if (navLevel === "year") {
      setView("main");
    }
  };

  const getBreadcrumb = () => {
    const parts = [];
    if (view === "ingresantes") {
      parts.push("Ingresantes");
      if (selectedYear) parts.push(selectedYear.toString());
      if (selectedMonth) parts.push(selectedMonth);
    } else if (view === "recorridos") {
      parts.push("Recorridos");
      if (selectedYear) parts.push(selectedYear.toString());
      if (selectedMonth) parts.push(selectedMonth);
      if (selectedDate) {
        const p = parseDateStr(selectedDate);
        parts.push(`${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}`);
      }
    } else if (view === "visitas") {
      parts.push("Visitas");
      if (selectedYear) parts.push(selectedYear.toString());
      if (selectedMonth) parts.push(selectedMonth);
    }
    return parts;
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const node = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
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
              Seguridad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 truncate">
              Archivos
            </h2>
            {getBreadcrumb().length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-[#4d6547] mt-1 flex-wrap">
                {getBreadcrumb().map((part, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[#c9b893]">›</span>}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-[#4d6547] text-sm">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-[#2d5016]/30 border-t-[#2d5016] animate-spin" />
              Cargando archivos…
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={fetchAllFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {archiveWarning && (
                <div className="mb-3 rounded-[14px] bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  {archiveWarning}
                </div>
              )}
              {view === "main" ? (
                <div className="space-y-3">
              <button
                onClick={() => {
                  setView("ingresantes");
                  setNavLevel("year");
                }}
                className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">Ingresantes</span>
                </div>
                <span className="text-[#2d5016] text-sm">→</span>
              </button>
              <button
                onClick={() => {
                  setView("recorridos");
                  setNavLevel("year");
                }}
                className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">Recorridos</span>
                </div>
                <span className="text-[#2d5016] text-sm">→</span>
              </button>
              <button
                onClick={() => {
                  setView("visitas");
                  setNavLevel("year");
                }}
                className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Users className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">Visitas</span>
                </div>
                <span className="text-[#2d5016] text-sm">→</span>
              </button>
                </div>
              ) : view === "visitas" ? (
                <div className="space-y-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              {navLevel === "year" ? (
                (() => {
                  const years = new Set<number>();
                  archivedVisits.forEach(v => {
                    years.add(parseDateStr(v.visit_date).year);
                  });
                  const sortedYears = Array.from(years).sort((a, b) => b - a);
                  return sortedYears.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#4d6547]">
                      No hay visitas archivadas
                    </div>
                  ) : (
                    sortedYears.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setNavLevel("month");
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                          <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">{year}</span>
                        </div>
                        <span className="text-[#2d5016] text-sm">→</span>
                      </button>
                    ))
                  );
                })()
              ) : navLevel === "month" ? (
                (() => {
                  const monthNames = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ];
                  const months = new Set<number>();
                  archivedVisits.forEach(v => {
                    const p = parseDateStr(v.visit_date);
                    if (p.year === selectedYear) {
                      months.add(p.month);
                    }
                  });
                  const sortedMonths = Array.from(months).sort((a, b) => a - b);
                  return sortedMonths.map(monthIdx => (
                    <button
                      key={monthIdx}
                      onClick={() => {
                        setSelectedMonth(monthNames[monthIdx]);
                        setNavLevel("files");
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                        <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">{monthNames[monthIdx]}</span>
                      </div>
                      <span className="text-[#2d5016] text-sm">→</span>
                    </button>
                  ));
                })()
              ) : (
                (() => {
                  const monthNames = [
                    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                  ];
                  const monthIdx = monthNames.indexOf(selectedMonth!);
                  const filtered = archivedVisits.filter(v => {
                    const p = parseDateStr(v.visit_date);
                    return p.year === selectedYear && p.month === monthIdx;
                  });
                  return filtered.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[#4d6547]">
                      No hay visitas en este período
                    </div>
                  ) : (
                    filtered.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-4 bg-white rounded-[14px] border border-[#E9E2CE]"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                            {visit.visitor_name}
                          </p>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            Leído
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#4d6547]">
                          <p><span className="font-medium">DNI:</span> {visit.visitor_dni}</p>
                          <p><span className="font-medium">Fecha:</span> {(() => { const p = parseDateStr(visit.visit_date); return `${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}`; })()}</p>
                          <p><span className="font-medium">Hora:</span> {visit.visit_time?.slice(0, 5)}hs</p>
                          <p><span className="font-medium">Relación:</span> {{familiar: "Familiar", amigo: "Amigo", proveedor: "Proveedor/Servicio", trabajo: "Trabajo", otro: "Otro"}[visit.relationship] || visit.relationship}</p>
                          {visit.license_plate && (
                            <p><span className="font-medium">Patente:</span> {visit.license_plate}</p>
                          )}
                          <p><span className="font-medium">Residente:</span> {visit.resident_name}</p>
                          <p><span className="font-medium">Lote:</span> {visit.resident_lot}</p>
                        </div>
                        {visit.notes && (
                          <p className="text-xs text-[#4d6547] mt-2">
                            <span className="font-medium">Notas:</span> {visit.notes}
                          </p>
                        )}
                        {visit.guard_comment && (
                          <div className="bg-green-50 rounded p-2 mt-2 border border-green-200">
                            <p className="text-[10px] font-medium text-green-700 mb-0.5">Comentario de guardia:</p>
                            <p className="text-xs text-[#1a1a1a] whitespace-pre-wrap">{visit.guard_comment}</p>
                          </div>
                        )}
                      </div>
                    ))
                  );
                })()
              )}
                </div>
              ) : navLevel === "year" ? (
                <div className="space-y-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              {(() => {
                const files = view === "ingresantes" ? ingresantesFiles : recorridosFiles;
                const years = getYears(files);
                return years.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#4d6547]">
                    No hay {view === "ingresantes" ? "ingresantes" : "recorridos"} archivados
                  </div>
                ) : (
                  years.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        setNavLevel("month");
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                        <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">{year}</span>
                      </div>
                      <span className="text-[#2d5016] text-sm">→</span>
                    </button>
                  ))
                );
              })()}
                </div>
              ) : navLevel === "month" ? (
                <div className="space-y-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              {getMonths(selectedYear!, view === "ingresantes" ? ingresantesFiles : recorridosFiles).map((month) => (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonth(month);
                    if (view === "recorridos") {
                      setNavLevel("date");
                    } else {
                      setNavLevel("files");
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                    <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">{month}</span>
                  </div>
                  <span className="text-[#2d5016] text-sm">→</span>
                </button>
              ))}
                </div>
              ) : navLevel === "date" ? (
                <div className="space-y-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              {getDates(selectedYear!, selectedMonth!, recorridosFiles).map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setNavLevel("files");
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                    <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                  </div>
                    <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                      {(() => {
                        const p = parseDateStr(date);
                        return `${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}`;
                      })()}
                    </span>
                  </div>
                  <span className="text-[#2d5016] text-sm">→</span>
                </button>
              ))}
                </div>
              ) : (
                <div className="space-y-3">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>
              {getFilteredFiles().length === 0 ? (
                <div className="text-center py-8 text-xs text-[#4d6547]">
                  No hay archivos disponibles
                </div>
              ) : (
                getFilteredFiles().map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white rounded-[14px] border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                        <FileText className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-[#4d6547]">
                          {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id, file.filename, view === "ingresantes" ? "ingresantes" : "recorridos")}
                        disabled={deletingId === file.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar archivo"
                      >
                        {deletingId === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
