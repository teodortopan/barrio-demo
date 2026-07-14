"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, ExternalLink, ChevronLeft, Folder } from "lucide-react";

interface AsambleaFile {
  id: string;
  filename: string;
  file_url: string;
  year: number;
  month: string;
  created_at: string;
}

interface AsambleaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavigationLevel = "year" | "month" | "files";

export function AsambleaModal({ isOpen, onClose }: AsambleaModalProps) {
  const [files, setFiles] = useState<AsambleaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [navLevel, setNavLevel] = useState<NavigationLevel>("year");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllFiles();
      // Reset navigation when modal opens
      setNavLevel("year");
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  }, [isOpen]);

  async function fetchAllFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/biblioteca-digital/asamblea/files");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching asamblea files:", result.error);
        setError("Error al cargar los archivos");
      } else {
        setFiles(result.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Error al cargar los archivos");
    } finally {
      setLoading(false);
    }
  }

  const handleFileClick = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
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

  // Get unique years from files
  const getYears = () => {
    const years = new Set<number>();
    files.forEach(file => {
      years.add(file.year);
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  };

  // Get unique months for a year
  const getMonths = (year: number) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const months = new Set<string>();
    files.forEach(file => {
      if (file.year === year) {
        months.add(file.month);
      }
    });

    return Array.from(months).sort((a, b) => {
      return monthNames.indexOf(a) - monthNames.indexOf(b);
    });
  };

  // Get filtered files based on navigation
  const getFilteredFiles = () => {
    let filtered = files;
    if (selectedYear) {
      filtered = filtered.filter(f => f.year === selectedYear);
    }
    if (selectedMonth) {
      filtered = filtered.filter(f => f.month === selectedMonth);
    }
    return filtered.sort((a, b) => {
      // Sort by created_at, most recent first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const handleBack = () => {
    if (navLevel === "files") {
      if (selectedMonth) {
        setSelectedMonth(null);
        setNavLevel("year");
      } else if (selectedYear) {
        setSelectedYear(null);
        setNavLevel("year");
      }
    } else if (navLevel === "month") {
      setSelectedMonth(null);
      setNavLevel("year");
    }
  };

  const getBreadcrumb = () => {
    const parts = ["Actas de Asamblea"];
    if (selectedYear) parts.push(selectedYear.toString());
    if (selectedMonth) parts.push(selectedMonth);
    return parts;
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const breadcrumb = getBreadcrumb();
  const cardClass =
    "w-full flex items-center justify-between gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors text-left";

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
              Biblioteca digital
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 truncate">
              Archivo de actas de asamblea
            </h2>
            {breadcrumb.length > 1 && (
              <div className="flex items-center gap-1 text-[11px] text-[#4d6547] mt-1 flex-wrap">
                {breadcrumb.map((part, i) => (
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

        {/* Content */}
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
          ) : navLevel === "year" ? (
            <div className="space-y-2">
              {getYears().length === 0 ? (
                <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center text-xs text-[#4d6547]">
                  No hay archivos disponibles
                </div>
              ) : (
                getYears().map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setNavLevel("month");
                    }}
                    className={cardClass}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                        <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                        {year}
                      </span>
                    </div>
                    <span className="shrink-0 text-[#2d5016] text-sm">→</span>
                  </button>
                ))
              )}
            </div>
          ) : navLevel === "month" ? (
            <div className="space-y-2">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Volver
              </button>
              {getMonths(selectedYear!).length === 0 ? (
                <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center text-xs text-[#4d6547]">
                  No hay archivos disponibles para este año
                </div>
              ) : (
                getMonths(selectedYear!).map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setNavLevel("files");
                    }}
                    className={cardClass}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                        <Folder className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-semibold uppercase tracking-wide text-[#1a2617]">
                        {month}
                      </span>
                    </div>
                    <span className="shrink-0 text-[#2d5016] text-sm">→</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium mb-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Volver
              </button>
              {getFilteredFiles().length === 0 ? (
                <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-6 text-center text-xs text-[#4d6547]">
                  No hay archivos disponibles
                </div>
              ) : (
                getFilteredFiles().map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileClick(file.file_url)}
                    className={cardClass}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] bg-[#2d5016]/10">
                        <FileText className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-[#1a2617] truncate">
                          {file.filename}
                        </p>
                        <p className="text-[10px] text-[#4d6547] mt-0.5">
                          {formatDate(file.created_at)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="shrink-0 w-4 h-4 text-[#2d5016]" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
