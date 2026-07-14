"use client";

import { useState, useEffect, useRef } from "react";

interface Recorrido {
  id: string;
  recorrido_time: string;
  notes: string | null;
  recorrido_date: string;
}

const RECORRIDO_TIMES = ["01:00", "03:00", "05:00", "19:00", "21:00"];

interface VigilanciaSectionProps {
  initialRecorridos?: Recorrido[];
  readOnly?: boolean;
}

export function VigilanciaSection({ initialRecorridos, readOnly = false }: VigilanciaSectionProps) {
  const [recorridos, setRecorridos] = useState<Recorrido[]>(initialRecorridos || []);
  const [loading, setLoading] = useState(!initialRecorridos);
  const [selectedShiftTime, setSelectedShiftTime] = useState<string>(RECORRIDO_TIMES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Local state for temp notes (source of truth until saved)
  const [tempNotes, setTempNotes] = useState<Record<string, string>>({});
  const noteTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Today in Buenos Aires timezone
  const today = (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  useEffect(() => {
    if (!initialRecorridos) fetchRecorridos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize DB time "01:00:00" → "01:00" to match RECORRIDO_TIMES
  const normalizeTime = (t: string) => t?.slice(0, 5) || t;

  async function fetchRecorridos() {
    try {
      const response = await fetch("/api/seguridad/recorridos");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching recorridos:", result.error);
      } else {
        const fetched = (result.recorridos || []).map((r: Recorrido) => ({
          ...r,
          recorrido_time: normalizeTime(r.recorrido_time),
        }));
        // Merge with temp notes — temp takes priority
        const updated = fetched.map((r: Recorrido) => ({
          ...r,
          notes: tempNotes[r.recorrido_time] !== undefined ? tempNotes[r.recorrido_time] : r.notes,
        }));
        setRecorridos(updated);
      }
    } catch (error) {
      console.error("Error fetching recorridos:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleNotesChange = async (recorridoId: string, notes: string) => {
    try {
      await fetch("/api/seguridad/recorridos/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recorridoId, notes }),
      });
    } catch (error) {
      console.error("Error updating recorrido notes:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const notesValue = tempNotes[selectedShiftTime] !== undefined
      ? tempNotes[selectedShiftTime]
      : (currentRecorrido.notes || "");

    try {
      if (currentRecorrido.id.startsWith("temp-")) {
        const response = await fetch("/api/seguridad/recorridos/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recorrido_time: selectedShiftTime,

            notes: notesValue,
            recorrido_date: today,
          }),
        });
        const result = await response.json();
        if (!result.error && result.recorrido) {
          setRecorridos(prev => {
            const existing = prev.find(r =>
              r.recorrido_time === selectedShiftTime && r.recorrido_date === today
            );
            if (existing) {
              return prev.map(r =>
                r.id === existing.id ? { ...result.recorrido, recorrido_time: normalizeTime(result.recorrido.recorrido_time), notes: notesValue } : r
              );
            }
            return [...prev, { ...result.recorrido, recorrido_time: normalizeTime(result.recorrido.recorrido_time), notes: notesValue }];
          });
        }
      } else {
        await handleNotesChange(currentRecorrido.id, notesValue);
      }

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get the current selected recorrido
  const getCurrentRecorrido = () => {
    const existing = recorridos.find(
      (r) => r.recorrido_time === selectedShiftTime && r.recorrido_date === today
    );
    if (existing) {
      return {
        ...existing,
        notes: tempNotes[selectedShiftTime] !== undefined ? tempNotes[selectedShiftTime] : existing.notes,
      };
    }
    return {
      id: `temp-${selectedShiftTime}`,
      recorrido_time: selectedShiftTime,
      completed: false,
      notes: tempNotes[selectedShiftTime] || null,
      recorrido_date: today,
    };
  };

  const currentRecorrido = getCurrentRecorrido();

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Cargando...</div>
    );
  }

  return (
    <>
      {/* Single Form for Recorrido */}
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
        <div className="flex items-end gap-2 mb-2.5">
          <div className="flex-1">
            <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1">
              Turno
            </label>
            <select
              value={selectedShiftTime}
              onChange={(e) => setSelectedShiftTime(e.target.value)}
              className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-2.5 py-1.5 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
            >
              {RECORRIDO_TIMES.map((time) => (
                <option key={time} value={time}>
                  Recorrido · {time}
                </option>
              ))}
            </select>
          </div>
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`shrink-0 inline-flex items-center justify-center px-3 py-1.5 rounded-[14px] text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                showSaved
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
              }`}
            >
              {showSaved ? "Guardado" : isSaving ? "Guardando…" : "Guardar"}
            </button>
          )}
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1">
            Notas
          </label>
          <textarea
            value={
              tempNotes[selectedShiftTime] !== undefined
                ? tempNotes[selectedShiftTime]
                : (currentRecorrido.notes || "")
            }
            onChange={(e) => {
              const notesValue = e.target.value;

              // Save to temp state immediately
              setTempNotes(prev => ({ ...prev, [selectedShiftTime]: notesValue }));

              // Clear existing timeout
              if (noteTimeouts.current[selectedShiftTime]) {
                clearTimeout(noteTimeouts.current[selectedShiftTime]);
              }

              // Debounce database update
              noteTimeouts.current[selectedShiftTime] = setTimeout(() => {
                if (currentRecorrido.id.startsWith('temp-')) {
                  fetch("/api/seguridad/recorridos/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      recorrido_time: selectedShiftTime,

                      notes: notesValue,
                      recorrido_date: today,
                    }),
                  }).then((response) => {
                    return response.json();
                  }).then((result) => {
                    if (!result.error && result.recorrido) {
                      setRecorridos(prev => {
                        const existing = prev.find(r =>
                          r.recorrido_time === selectedShiftTime && r.recorrido_date === today
                        );
                        if (existing) {
                          return prev.map(r =>
                            r.id === existing.id
                              ? { ...result.recorrido, recorrido_time: normalizeTime(result.recorrido.recorrido_time), notes: notesValue }
                              : r
                          );
                        }
                        return [...prev, { ...result.recorrido, recorrido_time: normalizeTime(result.recorrido.recorrido_time), notes: notesValue }];
                      });
                    }
                  });
                } else {
                  handleNotesChange(currentRecorrido.id, notesValue);
                }
              }, 1000);
            }}
            rows={3}
            readOnly={readOnly}
            placeholder="Detalle del recorrido…"
            className={`w-full bg-white border border-[#E9E2CE] rounded-[14px] px-2.5 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none ${readOnly ? "cursor-default" : ""}`}
          />
        </div>
      </div>
    </>
  );
}
