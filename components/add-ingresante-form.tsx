"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";

interface AddIngresanteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ingresante: {
    lote: string;
    nombre_apellido: string;
    tipo: "Propietario" | "Visita" | "Empleado";
    horario: string;
    documentacion?: string;
  }) => Promise<void>;
}

function getTodayDateDMY() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day}/${month}/${year}`;
}

function getNowTimeHM() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildHorarioISO(fechaDMY: string, horaHM: string): string | null {
  const fechaMatch = fechaDMY.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const horaMatch = horaHM.match(/^(\d{2}):(\d{2})$/);
  if (!fechaMatch || !horaMatch) return null;

  const [, day, month, year] = fechaMatch;
  const [, hour, minute] = horaMatch;
  const isoLike = `${year}-${month}-${day}T${hour}:${minute}:00`;
  const parsed = new Date(isoLike);
  if (Number.isNaN(parsed.getTime())) return null;
  return isoLike;
}

export function AddIngresanteForm({ isOpen, onClose, onAdd }: AddIngresanteFormProps) {
  const [lote, setLote] = useState("");
  const [nombreApellido, setNombreApellido] = useState("");
  const [tipo, setTipo] = useState<"Propietario" | "Visita" | "Empleado" | "">("");
  const [fecha, setFecha] = useState(getTodayDateDMY());
  const [hora, setHora] = useState(getNowTimeHM());
  const [documentacion, setDocumentacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const horario = buildHorarioISO(fecha, hora);
    if (!lote.trim() || !nombreApellido.trim() || !tipo || !horario) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        lote: lote.trim(),
        nombre_apellido: nombreApellido.trim(),
        tipo: tipo as "Propietario" | "Visita" | "Empleado",
        horario,
        documentacion: documentacion.trim() || undefined,
      });
      setLote("");
      setNombreApellido("");
      setTipo("");
      setFecha(getTodayDateDMY());
      setHora(getNowTimeHM());
      setDocumentacion("");
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error("Error in form submission:", err);
      setError("Error al agregar el ingresante. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLote("");
    setNombreApellido("");
    setTipo("");
    setFecha(getTodayDateDMY());
    setHora(getNowTimeHM());
    setDocumentacion("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setLote("");
      setNombreApellido("");
      setTipo("");
      setFecha(getTodayDateDMY());
      setHora(getNowTimeHM());
      setDocumentacion("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const inputClass =
    "w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5";

  const formIncomplete =
    isSubmitting ||
    !lote.trim() ||
    !nombreApellido.trim() ||
    !tipo ||
    !buildHorarioISO(fecha, hora);

  const node = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <Plus className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Seguridad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Añadir ingresante
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="space-y-4">
            <div>
              <label htmlFor="lote" className={labelClass}>Lote</label>
              <input
                type="text"
                id="lote"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="Ej. 47"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="nombreApellido" className={labelClass}>Nombre y apellido</label>
              <input
                type="text"
                id="nombreApellido"
                value={nombreApellido}
                onChange={(e) => setNombreApellido(e.target.value)}
                className={inputClass}
                placeholder="Ej. Carlos Rodríguez"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="tipo" className={labelClass}>Tipo</label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "Propietario" | "Visita" | "Empleado" | "")}
                className={inputClass}
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccionar tipo…</option>
                <option value="Propietario">Propietario</option>
                <option value="Visita">Visita</option>
                <option value="Empleado">Empleado</option>
              </select>
            </div>

            <div>
              <label htmlFor="fecha-ingresante" className={labelClass}>
                Horario{" "}
                <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                  (DD/MM/YYYY · HH:MM)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  id="fecha-ingresante"
                  inputMode="numeric"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`${inputClass} font-mono`}
                  required
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  id="hora-ingresante"
                  inputMode="numeric"
                  value={hora}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^0-9:]/g, "");
                    if (v.length === 2 && !v.includes(":") && hora.length < v.length) {
                      v = v + ":";
                    }
                    if (v.length <= 5) setHora(v);
                  }}
                  placeholder="00:00"
                  maxLength={5}
                  pattern="([01]?\d|2[0-3]):[0-5]\d"
                  className={`${inputClass} font-mono`}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="documentacion" className={labelClass}>
                Documentación{" "}
                <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                  (opcional)
                </span>
              </label>
              <textarea
                id="documentacion"
                value={documentacion}
                onChange={(e) => setDocumentacion(e.target.value)}
                rows={4}
                placeholder="DNI, motivo, vehículo, etc."
                className={`${inputClass} resize-none`}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-dashed border-[#E9E2CE]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formIncomplete}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors ${
                  formIncomplete
                    ? "bg-[#ede4d2] text-[#c9b893] cursor-not-allowed"
                    : "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
                }`}
              >
                {isSubmitting ? "Agregando…" : "Añadir"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
