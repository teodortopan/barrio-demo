"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface AddSecurityNoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (note: {
    concepto: string;
    categoria: string;
    monto: string;
    notas?: string;
  }) => void;
}

export function AddSecurityNoteForm({ isOpen, onClose, onAdd }: AddSecurityNoteFormProps) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concepto.trim() || !categoria || !monto.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        concepto: concepto.trim(),
        categoria,
        monto: monto.trim(),
        notas: notas.trim() || undefined,
      });
      setConcepto("");
      setCategoria("");
      setMonto("");
      setNotas("");
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error("Error in form submission:", err);
      setError("Error al agregar la nota. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setConcepto("");
    setCategoria("");
    setMonto("");
    setNotas("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setConcepto("");
      setCategoria("");
      setMonto("");
      setNotas("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-[#2d5016]" />
            <h2 className="text-2xl font-bold text-[#1a1a1a]">
              Añadir nota
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="concepto"
                className="block text-sm font-medium text-[#1a1a1a] mb-2"
              >
                Concepto
              </label>
              <input
                type="text"
                id="concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full bg-gray-100 rounded-[14px] px-4 py-2 text-sm text-[#1a1a1a] placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="categoria"
                className="block text-sm font-medium text-[#1a1a1a] mb-2"
              >
                Categoría
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-gray-100 rounded-[14px] px-4 py-2 text-sm text-[#1a1a1a] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50"
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccionar categoría</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Luminarias">Luminarias</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="monto"
                className="block text-sm font-medium text-[#1a1a1a] mb-2"
              >
                Monto
              </label>
              <input
                type="text"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-gray-100 rounded-[14px] px-4 py-2 text-sm text-[#1a1a1a] placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="notas"
                className="block text-sm font-medium text-[#1a1a1a] mb-2"
              >
                Notas
              </label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full bg-gray-100 rounded-[14px] px-4 py-2 text-sm text-[#1a1a1a] placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2d5016]/50"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[14px] p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

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
                disabled={!concepto.trim() || !categoria || !monto.trim() || isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-[#2d5016] rounded-[14px] hover:bg-[#3a6a1f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Agregando...
                  </>
                ) : (
                  "Añadir"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
