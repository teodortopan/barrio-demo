"use client";

import { useState, useEffect } from "react";
import { X, Upload, FileText } from "lucide-react";

interface ComprobanteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseId: string;
  expenseConcepto: string;
  onUploadSuccess: () => void;
  uploadUrl?: string;
  title?: string;
}

export function ComprobanteUploadModal({
  isOpen,
  onClose,
  expenseId,
  expenseConcepto,
  onUploadSuccess,
  uploadUrl = "/api/expenses/upload-comprobante",
  title = "Subir comprobante",
}: ComprobanteUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type (PDF or images)
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Solo se permiten archivos PDF o imágenes (JPG, PNG, GIF, WEBP)");
        setFile(null);
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("El archivo debe ser menor a 10MB");
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Por favor selecciona un archivo PDF o imagen");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expenseId", expenseId);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setIsUploading(false);
        return;
      }

      // Success - close modal and refresh expenses
      setFile(null);
      setError(null);
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading comprobante:", error);
      setError("Error al subir el comprobante");
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setError(null);
      setIsUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        // Close modal when clicking outside (but not during upload)
        if (e.target === e.currentTarget && !isUploading) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-[#2d5016]" />
            <h2 className="text-2xl font-bold text-[#1a1a1a]">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Expense info */}
            <div className="bg-gray-50 rounded-[14px] p-3">
              <p className="text-xs text-gray-600 mb-1">Gasto:</p>
              <p className="text-sm font-medium text-[#1a1a1a]">{expenseConcepto}</p>
            </div>

            {/* File input */}
            <div>
              <label
                htmlFor="comprobante-file"
                className="block text-sm font-medium text-[#1a1a1a] mb-2"
              >
                Archivo PDF o Imagen
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-[14px] p-6 text-center hover:border-[#2d5016] transition-colors">
                <input
                  type="file"
                  id="comprobante-file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="comprobante-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <FileText className="w-8 h-8 text-gray-400" />
                  {file ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-[#1a1a1a]">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Haz clic para seleccionar un PDF o imagen
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, JPG, PNG, GIF o WEBP - Máximo 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[14px] p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-sm font-medium text-[#1a1a1a] bg-gray-100 rounded-[14px] hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="px-6 py-2 text-sm font-medium text-white bg-[#2d5016] rounded-[14px] hover:bg-[#3a6a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
