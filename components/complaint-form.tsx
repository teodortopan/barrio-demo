"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText } from "lucide-react";
import { MI_GESTION_REFRESH_EVENT } from "@/lib/mi-gestion-events";

interface ComplaintFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComplaintForm({ isOpen, onClose }: ComplaintFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitInFlightRef = useRef(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimeout = () => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setComplaintType("");
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitInFlightRef.current || isSubmitting || isSubmitted) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const trimmedComplaintType = complaintType.trim();

    try {
      const response = await fetch("/api/complaints/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          category: trimmedCategory,
          complaintType: trimmedComplaintType,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("Error submitting complaint:", result.error);
        alert("Error al enviar. Por favor, intentá de nuevo.");
        setIsSubmitting(false);
        submitInFlightRef.current = false;
        return;
      }

      setIsSubmitting(false);
      submitInFlightRef.current = false;
      setIsSubmitted(true);
      window.dispatchEvent(new CustomEvent(MI_GESTION_REFRESH_EVENT));

      // Reset form after showing success message
      clearSuccessTimeout();
      successTimeoutRef.current = setTimeout(() => {
        successTimeoutRef.current = null;
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Error al enviar. Por favor, intentá de nuevo.");
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      clearSuccessTimeout();
      submitInFlightRef.current = false;
      resetForm();
      onClose();
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return clearSuccessTimeout;
  }, []);

  if (!isOpen || !mounted) return null;

  const inputClass =
    "w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5";

  const formIncomplete =
    isSubmitting ||
    isSubmitted ||
    !title.trim() ||
    !description.trim() ||
    !category.trim() ||
    !complaintType.trim();

  const node = (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <FileText className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Mi gestión
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Nueva gestión
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

        {/* Form / Success */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          {isSubmitted ? (
            <div className="rounded-[14px] bg-white border border-[#E9E2CE] px-5 py-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-green-100 mb-3">
                <svg
                  className="w-6 h-6 text-green-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base font-bold uppercase tracking-wide text-[#1a2617] mb-1">
                Mensaje enviado
              </p>
              <p className="text-xs text-[#4d6547]">
                La administración va a revisar tu mensaje y responder pronto.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#3c3c3c] mb-4 leading-relaxed">
                Cargá el detalle para que la administración pueda atender tu consulta, sugerencia o reclamo.
              </p>

              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label htmlFor="complaintType" className={labelClass}>
                    Tipo
                  </label>
                  <select
                    id="complaintType"
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Seleccionar tipo…</option>
                    <option value="consulta">Consulta</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="reclamo">Reclamo</option>
                  </select>
                </div>

                {/* Dirigido a */}
                <div>
                  <label htmlFor="category" className={labelClass}>
                    Dirigido a
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Seleccionar destinatario…</option>
                    <option value="administrador">Administrador</option>
                    <option value="administracion">Administración</option>
                    <option value="coordinacion">Coordinación</option>
                    <option value="cuentas">Cuentas</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="seguridad">Seguridad</option>
                  </select>
                </div>

                {/* Título */}
                <div>
                  <label htmlFor="title" className={labelClass}>
                    Título
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                    placeholder="Ej. Filtración en el parque sur"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="description" className={labelClass}>
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Contanos los detalles para que podamos resolverlo."
                    className={`${inputClass} resize-none`}
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-dashed border-[#E9E2CE]">
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
                  {isSubmitting ? "Enviando…" : "Enviar gestión"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
