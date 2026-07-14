"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Users } from "lucide-react";
import { MI_GESTION_REFRESH_EVENT } from "@/lib/mi-gestion-events";

interface VisitFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisitForm({ isOpen, onClose }: VisitFormProps) {
  const [visitorName, setVisitorName] = useState("");
  const [visitorDni, setVisitorDni] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
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
    setVisitorName("");
    setVisitorDni("");
    setVisitDate("");
    setVisitTime("");
    setLicensePlate("");
    setRelationship("");
    setNotes("");
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitInFlightRef.current || isSubmitting || isSubmitted) return;
    submitInFlightRef.current = true;
    setIsSubmitting(true);

    const trimmedVisitorName = visitorName.trim();
    const trimmedVisitorDni = visitorDni.trim();
    const trimmedVisitDate = visitDate.trim();
    const trimmedVisitTime = visitTime.trim();
    const trimmedLicensePlate = licensePlate.trim().toUpperCase();
    const trimmedRelationship = relationship.trim();
    const trimmedNotes = notes.trim();

    try {
      const response = await fetch("/api/visits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: trimmedVisitorName,
          visitorDni: trimmedVisitorDni,
          visitDate: trimmedVisitDate,
          visitTime: trimmedVisitTime,
          licensePlate: trimmedLicensePlate,
          relationship: trimmedRelationship,
          notes: trimmedNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error("Error submitting visit:", result.error);
        alert("Error al autorizar la visita. Por favor, intentá de nuevo.");
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
      console.error("Error submitting visit:", error);
      alert("Error al autorizar la visita. Por favor, intentá de nuevo.");
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

  // Get today's date in YYYY-MM-DD format for min date (Buenos Aires timezone)
  const today = (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return clearSuccessTimeout;
  }, []);

  if (!isOpen || !mounted) return null;

  const inputClass =
    "w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors";
  const tightInputClass =
    "w-full min-w-0 bg-white border border-[#E9E2CE] rounded-[14px] px-2 h-10 text-[11px] sm:text-sm text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5";
  const formIncomplete =
    isSubmitting ||
    isSubmitted ||
    !visitorName.trim() ||
    !visitorDni.trim() ||
    !visitDate.trim() ||
    !visitTime.trim() ||
    !relationship.trim();

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
            <Users className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Mi gestión
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Autorizar visita
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
                Visita autorizada
              </p>
              <p className="text-xs text-[#4d6547]">
                La autorización fue enviada a seguridad.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#3c3c3c] mb-4 leading-relaxed">
                Completá los datos para que la garita reconozca a tu visita al ingresar al barrio.
              </p>

              <div className="space-y-4">
                {/* Visitor Name */}
                <div>
                  <label htmlFor="visitorName" className={labelClass}>
                    Nombre completo del visitante
                  </label>
                  <input
                    type="text"
                    id="visitorName"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className={inputClass}
                    placeholder="Ej. Martín Cabrera"
                    required
                  />
                </div>

                {/* Visitor DNI */}
                <div>
                  <label htmlFor="visitorDni" className={labelClass}>
                    DNI del visitante
                  </label>
                  <input
                    type="text"
                    id="visitorDni"
                    value={visitorDni}
                    onChange={(e) => setVisitorDni(e.target.value)}
                    className={`${inputClass} font-mono`}
                    placeholder="00.000.000"
                    required
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0 overflow-hidden">
                    <label htmlFor="visitDate" className={labelClass}>
                      Fecha de visita
                    </label>
                    <input
                      type="date"
                      id="visitDate"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      min={today}
                      className={tightInputClass}
                      required
                    />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <label htmlFor="visitTime" className={labelClass}>
                      Hora de visita
                    </label>
                    <input
                      type="time"
                      id="visitTime"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className={tightInputClass}
                      required
                    />
                  </div>
                </div>

                {/* License Plate */}
                <div>
                  <label htmlFor="licensePlate" className={labelClass}>
                    Patente del vehículo{" "}
                    <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                      (opcional)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="licensePlate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    className={`${inputClass} font-mono uppercase`}
                    placeholder="AE 342 LP"
                  />
                </div>

                {/* Relationship */}
                <div>
                  <label htmlFor="relationship" className={labelClass}>
                    Relación con el visitante
                  </label>
                  <select
                    id="relationship"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className={inputClass}
                    required
                  >
                    <option value="">Seleccionar relación…</option>
                    <option value="familiar">Familiar</option>
                    <option value="amigo">Amigo</option>
                    <option value="proveedor">Proveedor / servicio</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className={labelClass}>
                    Notas adicionales{" "}
                    <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                      (opcional)
                    </span>
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Detalle que la guardia tendría que saber"
                    className={`${inputClass} resize-none`}
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
                  {isSubmitting ? "Enviando…" : "Autorizar visita"}
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
