"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function LoadVecinosButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Por favor selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    if (!confirm("¿Estás seguro? Esto reemplazará todos los datos actuales de vecinos con los datos del Excel seleccionado.")) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vecinos/load", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load data");
      }

      setSuccess(true);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Refresh the page after 2 seconds to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleFileSelect}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-[14px] hover:bg-[#3a6a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Cargado</span>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            <span>Cargar desde Excel</span>
          </>
        )}
      </button>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
