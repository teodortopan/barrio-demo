"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "lucide-react";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

interface AddVecinoTargetPeriod {
  year: number;
  month: number;
  isCurrent: boolean;
}

interface PropietarioSuggestion {
  id: string;
  name: string;
  lot: string;
  usageCount: number;
}

interface AddVecinoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void; // Callback to refresh the table
  targetPeriod?: AddVecinoTargetPeriod;
}

export function AddVecinoForm({ isOpen, onClose, onAdd, targetPeriod }: AddVecinoFormProps) {
  const [lote, setLote] = useState("");
  const [propietario, setPropietario] = useState("");
  const [concepto, setConcepto] = useState("");
  const [cargo, setCargo] = useState("");
  const [pago, setPago] = useState("");
  const [suggestions, setSuggestions] = useState<PropietarioSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTargetMonthName = () => {
    const targetMonthIndex = targetPeriod
      ? targetPeriod.month - 1
      : new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getMonth();
    const monthName = MONTH_NAMES[targetMonthIndex] || MONTH_NAMES[0];
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

  const defaultConcepto = `Cuota de ${getTargetMonthName()}`;

  useEffect(() => {
    if (!isOpen || !lote.trim() || !/\d/.test(lote)) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(`/api/admin/vecinos-owner-suggestions?lote=${encodeURIComponent(lote)}`, {
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || result.error) {
          setSuggestions([]);
          return;
        }
        setSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
        setSuggestionsOpen(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) setSuggestionsLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isOpen, lote]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!lote.trim() || !propietario.trim()) {
      setError("Lote y Propietario son campos obligatorios");
      return;
    }

    // Parse numeric values
    const cargoNum = parseFloat(cargo) || 0;
    const pagoNum = parseFloat(pago) || 0;
    const saldoNum = cargoNum - pagoNum;
    const estado = saldoNum > 0 ? "Deudor" : "Al día";

    setIsSubmitting(true);

    try {
      const isHistoricalTarget = targetPeriod && !targetPeriod.isCurrent;
      const response = await fetch(isHistoricalTarget ? "/api/admin/vecinos-history" : "/api/vecinos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lote: lote.trim(),
          propietario: propietario.trim(),
          concepto: concepto.trim() || defaultConcepto,
          cargo: cargoNum,
          pago: pagoNum,
          saldo: saldoNum,
          estado: estado,
          ...(isHistoricalTarget
            ? { period_year: targetPeriod.year, period_month: targetPeriod.month }
            : {}),
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error || "Error al crear el vecino");
        return;
      }

      // Reset form
      setLote("");
      setPropietario("");
      setConcepto("");
      setCargo("");
      setPago("");
      setSuggestions([]);
      setSuggestionsOpen(false);
      setError(null);

      // Close modal and refresh table
      onAdd();
      onClose();
    } catch (err) {
      console.error("Error creating vecino:", err);
      setError("Error al crear el vecino. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setLote("");
      setPropietario("");
      setConcepto("");
      setCargo("");
      setPago("");
      setSuggestions([]);
      setSuggestionsOpen(false);
      setError(null);
      onClose();
    }
  };

  const inputClass =
    "w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors";
  const labelClass =
    "block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5";

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
              Ingresos
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Añadir ingreso
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="relative">
            <label className={labelClass}>
              Lote <span className="text-red-500 font-medium tracking-normal normal-case">*</span>
            </label>
            <input
              type="text"
              value={lote}
              onChange={(e) => {
                setLote(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setSuggestionsOpen(true);
              }}
              onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
              placeholder="Ej. 171, 172"
              className={`${inputClass} font-mono`}
              required
              disabled={isSubmitting}
            />
            {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
              <div className="absolute left-0 right-0 top-[64px] z-20 overflow-hidden rounded-[14px] border border-[#E9E2CE] bg-white shadow-lg">
                {suggestionsLoading && suggestions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[#4d6547]">Buscando propietarios…</div>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setPropietario(suggestion.name);
                        setSuggestionsOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-[#eef1ea] transition-colors"
                    >
                      <span className="block text-sm font-semibold text-[#1a2617]">{suggestion.name}</span>
                      <span className="block text-[10px] text-[#4d6547]">
                        Lote {suggestion.lot}
                        {suggestion.usageCount > 0 ? ` · usado ${suggestion.usageCount} vez${suggestion.usageCount === 1 ? "" : "es"}` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
            <p className="text-[10px] text-[#4d6547] mt-1">Separar múltiples lotes con comas</p>
          </div>

          <div>
            <label className={labelClass}>
              Propietario <span className="text-red-500 font-medium tracking-normal normal-case">*</span>
            </label>
            <input
              type="text"
              value={propietario}
              onChange={(e) => setPropietario(e.target.value)}
              placeholder="Nombre y apellido"
              className={inputClass}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className={labelClass}>
              Concepto{" "}
              <span className="text-[#c9b893] font-medium tracking-normal normal-case">
                (opcional)
              </span>
            </label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder={defaultConcepto}
              className={inputClass}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cargo</label>
              <input
                type="number"
                step="0.01"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="0"
                className={`${inputClass} font-mono`}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className={labelClass}>Pago</label>
              <input
                type="number"
                step="0.01"
                value={pago}
                onChange={(e) => setPago(e.target.value)}
                placeholder="0"
                className={`${inputClass} font-mono`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-dashed border-[#E9E2CE]">
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Añadiendo…" : "Añadir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
