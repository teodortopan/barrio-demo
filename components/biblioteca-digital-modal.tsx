"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Map, FileText, Archive, Upload, BookOpen, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface BibliotecaDigitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDocumentType?: "plano" | "reglamento" | "asamblea";
}

export function BibliotecaDigitalModal({
  isOpen,
  onClose,
  initialDocumentType,
}: BibliotecaDigitalModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successDocumentType, setSuccessDocumentType] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-select the document type when the modal opens via a specific tile.
  useEffect(() => {
    if (isOpen && initialDocumentType) {
      setSelectedDocument(initialDocumentType);
    }
  }, [isOpen, initialDocumentType]);

  if (!isOpen || !mounted) return null;

  const documentos = [
    { id: "plano", name: "Plano de los lotes", icon: Map },
    { id: "reglamento", name: "Reglamento aprobado", icon: FileText },
    { id: "asamblea", name: "Archivo de Actas de Asamblea", icon: Archive },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDocument || !selectedFile) {
      setError("Por favor selecciona un documento y un archivo PDF");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("documentType", selectedDocument);
      formData.append("file", selectedFile);

      const response = await fetch("/api/biblioteca-digital/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Archivo "${selectedFile.name}" subido exitosamente`);
        setSuccessDocumentType(selectedDocument);
        setSelectedFile(null);
        setSelectedDocument(null);
        const fileInput = document.getElementById("file-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(result.error || "Error al subir el archivo");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error al subir el archivo. Por favor intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedDocument(null);
      setSelectedFile(null);
      setError(null);
      setSuccess(null);
      setSuccessDocumentType(null);
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      onClose();
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <BookOpen className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Comunidad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Biblioteca Digital
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {!selectedDocument ? (
            <>
              <p className="text-xs text-[#4d6547] mb-3">
                Seleccioná el documento que deseás actualizar:
              </p>
              <div className="space-y-2">
                {documentos.map((doc) => {
                  const Icon = doc.icon;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        if (successDocumentType && successDocumentType !== doc.id) {
                          setSuccess(null);
                          setSuccessDocumentType(null);
                        }
                        setSelectedDocument(doc.id);
                        setError(null);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#eef1ea]/40 transition-colors text-left"
                    >
                      <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                        <Icon className="w-4 h-4 text-[#2d5016]" strokeWidth={1.6} />
                      </div>
                      <span className="text-sm text-[#1a2617]">{doc.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    setSelectedDocument(null);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#2d5016] hover:underline disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver
                </button>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#1a2617]">
                  {documentos.find((d) => d.id === selectedDocument)?.name}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5">
                    Seleccionar archivo PDF
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="w-full text-xs text-[#4d6547] file:mr-3 file:py-1.5 file:px-3 file:rounded-[14px] file:border-0 file:text-xs file:font-semibold file:bg-[#2d3d2a] file:text-[#faf6ec] hover:file:bg-[#22301f] file:cursor-pointer disabled:opacity-50"
                  />
                </div>

                {selectedFile && (
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-0.5">
                      Archivo seleccionado
                    </div>
                    <div className="text-xs text-[#1a2617] truncate">{selectedFile.name}</div>
                    <div className="text-[10px] text-[#c9b893] mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && successDocumentType === selectedDocument && (
                  <div className="flex items-center gap-2 rounded-[14px] bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-dashed border-[#E9E2CE]">
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading
                      ? "Subiendo…"
                      : selectedDocument === "asamblea"
                      ? "Subir archivo"
                      : "Subir y reemplazar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
