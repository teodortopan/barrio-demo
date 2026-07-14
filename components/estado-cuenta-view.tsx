"use client";

import { useState, useEffect } from "react";
import { FileText, Download, X, Loader2 } from "lucide-react";

interface EstadoCuentaFile {
  id: string;
  month: string;
  year: number;
  filename: string;
  file_url: string;
  created_at: string;
}

export function EstadoCuentaView() {
  const [files, setFiles] = useState<EstadoCuentaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch("/api/archivo/estado-cuenta");
        const result = await response.json();

        if (result.error) {
          console.error("Error fetching estado de cuenta files:", result.error);
        } else {
          setFiles(result.files || []);
        }
      } catch (error) {
        console.error("Error fetching estado de cuenta files:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFiles();
  }, []);

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar "${filename}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(fileId);

    try {
      const response = await fetch(`/api/archivo/estado-cuenta/${fileId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar el archivo");
      }

      // Remove from local state
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar el archivo");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No hay archivos de estado de cuenta disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-[14px] border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#2d5016]" />
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">
                {file.month} {file.year} - Estado de Cuenta
              </p>
              <p className="text-xs text-gray-500">
                Generado el {new Date(file.created_at).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })} a las {new Date(file.created_at).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-[14px] hover:bg-[#3a6a1f] transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>
            <button
              onClick={() => handleDelete(file.id, file.filename)}
              disabled={deletingId === file.id}
              className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      ))}
    </div>
  );
}
