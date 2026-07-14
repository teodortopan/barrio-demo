"use client";

import { useState, useEffect } from "react";
import { X, FileText, ExternalLink } from "lucide-react";

interface IngresantesFile {
  id: string;
  filename: string;
  file_url: string;
  month: string;
  year: number;
  week: number;
  created_at: string;
}

interface IngresantesArchivosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IngresantesArchivosModal({ isOpen, onClose }: IngresantesArchivosModalProps) {
  const [files, setFiles] = useState<IngresantesFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/seguridad/ingresantes/files");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching files:", result.error);
        setError(result.error || "Error al cargar los archivos");
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#2d5016]" />
            <h2 className="text-2xl font-bold text-[#1a1a1a]">
              Archivos de Ingresantes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable (shows ~5 items, then scrolls) */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 100px)' }}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando archivos...
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchFiles}
                className="mt-4 px-4 py-2 bg-[#2d5016] text-white rounded-[14px] hover:bg-[#3a6a1f] transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay archivos disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file.file_url)}
                  className="flex items-center justify-between p-4 bg-gray-100 rounded-[14px] border border-gray-200 hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-[#2d5016] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a1a] truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(file.created_at)}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
