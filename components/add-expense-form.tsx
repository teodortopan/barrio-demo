"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, FileText, Trash2, ChevronDown } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/expenses/categories";

interface AddExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  canManagePresets?: boolean;
  onAdd: (expense: {
    concepto: string;
    categoria: string;
    proveedor: string;
    saldo: string;
    fecha: string;
    vencimiento: string;
    file?: File | null;
    facturaFile?: File | null;
  }) => Promise<void>;
}

function todayISO() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Preset {
  id: string;
  name: string;
}

export function AddExpenseForm({ isOpen, onClose, canManagePresets = true, onAdd }: AddExpenseFormProps) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [saldo, setSaldo] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [vencimiento, setVencimiento] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proveedor presets
  const [provPresets, setProvPresets] = useState<Preset[]>([]);
  const [showProvPresets, setShowProvPresets] = useState(false);
  const [newProvPreset, setNewProvPreset] = useState("");
  const [addingProvPreset, setAddingProvPreset] = useState(false);
  const provPresetsRef = useRef<HTMLDivElement>(null);

  // Concepto presets
  const [concPresets, setConcPresets] = useState<Preset[]>([]);
  const [showConcPresets, setShowConcPresets] = useState(false);
  const [newConcPreset, setNewConcPreset] = useState("");
  const [addingConcPreset, setAddingConcPreset] = useState(false);
  const concPresetsRef = useRef<HTMLDivElement>(null);

  // Fetch presets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch("/api/expenses/proveedores")
        .then((res) => res.json())
        .then((data) => setProvPresets(data.presets || []))
        .catch(() => setProvPresets([]));
      fetch("/api/expenses/conceptos")
        .then((res) => res.json())
        .then((data) => setConcPresets(data.presets || []))
        .catch(() => setConcPresets([]));
    }
  }, [isOpen]);

  // Close proveedor presets popup on click outside
  useEffect(() => {
    if (!showProvPresets) return;
    const handleClick = (e: MouseEvent) => {
      if (provPresetsRef.current && !provPresetsRef.current.contains(e.target as Node)) {
        setShowProvPresets(false);
        setNewProvPreset("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProvPresets]);

  // Close concepto presets popup on click outside
  useEffect(() => {
    if (!showConcPresets) return;
    const handleClick = (e: MouseEvent) => {
      if (concPresetsRef.current && !concPresetsRef.current.contains(e.target as Node)) {
        setShowConcPresets(false);
        setNewConcPreset("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showConcPresets]);

  const handleAddProvPreset = async () => {
    if (!canManagePresets) return;
    if (!newProvPreset.trim() || addingProvPreset) return;
    setAddingProvPreset(true);
    try {
      const res = await fetch("/api/expenses/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProvPreset.trim() }),
      });
      const data = await res.json();
      if (data.preset) {
        setProvPresets((prev) => [...prev, data.preset].sort((a, b) => a.name.localeCompare(b.name)));
        setNewProvPreset("");
      }
    } catch {
      // silently fail
    } finally {
      setAddingProvPreset(false);
    }
  };

  const handleDeleteProvPreset = async (id: string) => {
    if (!canManagePresets) return;
    try {
      await fetch(`/api/expenses/proveedores?id=${id}`, { method: "DELETE" });
      setProvPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  };

  const handleAddConcPreset = async () => {
    if (!canManagePresets) return;
    if (!newConcPreset.trim() || addingConcPreset) return;
    setAddingConcPreset(true);
    try {
      const res = await fetch("/api/expenses/conceptos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newConcPreset.trim() }),
      });
      const data = await res.json();
      if (data.preset) {
        setConcPresets((prev) => [...prev, data.preset].sort((a, b) => a.name.localeCompare(b.name)));
        setNewConcPreset("");
      }
    } catch {
      // silently fail
    } finally {
      setAddingConcPreset(false);
    }
  };

  const handleDeleteConcPreset = async (id: string) => {
    if (!canManagePresets) return;
    try {
      await fetch(`/api/expenses/conceptos?id=${id}`, { method: "DELETE" });
      setConcPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silently fail
    }
  };

  const allowedFileTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!allowedFileTypes.includes(selectedFile.type)) {
        setError("Solo se permiten archivos PDF o imágenes (JPG, PNG, GIF, WEBP)");
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("El archivo debe ser menor a 10MB");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleFacturaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!allowedFileTypes.includes(selectedFile.type)) {
        setError("Solo se permiten archivos PDF o imágenes (JPG, PNG, GIF, WEBP)");
        setFacturaFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("El archivo debe ser menor a 10MB");
        setFacturaFile(null);
        return;
      }
      setError(null);
      setFacturaFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concepto.trim() || !categoria || !proveedor.trim() || !saldo.trim() || !fecha) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        concepto: concepto.trim(),
        categoria,
        proveedor: proveedor.trim(),
        saldo: saldo.trim(),
        fecha,
        vencimiento,
        file: file || null,
        facturaFile: facturaFile || null,
      });
      // Reset form only on success
      resetForm();
      onClose();
    } catch (err) {
      console.error("Error in form submission:", err);
      setError("Error al agregar el gasto. Por favor intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setConcepto("");
    setCategoria("");
    setProveedor("");
    setSaldo("");
    setFecha(todayISO());
    setVencimiento("");
    setFile(null);
    setFacturaFile(null);
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
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
              Egresos
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Añadir salida
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Fecha */}
            <div>
              <label
                htmlFor="expense-fecha"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Fecha
              </label>
              <input
                type="date"
                id="expense-fecha"
                lang="es-AR"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Vencimiento */}
            <div>
              <label
                htmlFor="expense-vencimiento"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Vencimiento <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                id="expense-vencimiento"
                lang="es-AR"
                value={vencimiento}
                onChange={(e) => setVencimiento(e.target.value)}
                className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                disabled={isSubmitting}
              />
            </div>

            {/* Concepto */}
            <div className="relative" ref={concPresetsRef}>
              <label
                htmlFor="concepto"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Concepto
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="concepto"
                  value={concepto}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConcepto(val);
                  }}
                  className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 pr-10 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
                  required
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConcPresets((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-[14px] text-[#4d6547] hover:bg-[#FBF8EF] transition-colors"
                  aria-label="Mostrar conceptos guardados"
                  title="Conceptos guardados"
                  disabled={isSubmitting}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-[#2d5016] transition-transform ${showConcPresets ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Concepto presets popup */}
              {showConcPresets && (() => {
                const q = concepto.trim().toLowerCase();
                const visible = q
                  ? concPresets.filter((p) => p.name.toLowerCase().includes(q))
                  : concPresets;
                return (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[14px] shadow-lg z-50 max-h-60 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {visible.length > 0 ? (
                      <ul className="py-1">
                        {visible.map((preset) => (
                          <li
                            key={preset.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setConcepto(preset.name);
                                setShowConcPresets(false);
                              }}
                              className="flex-1 text-left text-sm text-[#1a1a1a]"
                            >
                              {preset.name}
                            </button>
                            {canManagePresets && (
                              <button
                                type="button"
                                onClick={() => handleDeleteConcPreset(preset.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-400">
                        {q ? "Sin coincidencias" : "Sin conceptos guardados"}
                      </p>
                    )}
                  </div>
                  {canManagePresets && (
                    <div className="shrink-0 border-t border-gray-200 px-3 py-2 flex gap-2">
                      <input
                        type="text"
                        value={newConcPreset}
                        onChange={(e) => setNewConcPreset(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddConcPreset(); } }}
                        placeholder="Nuevo concepto..."
                        className="flex-1 text-sm bg-gray-50 rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2d5016]/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddConcPreset}
                        disabled={!newConcPreset.trim() || addingConcPreset}
                        className="text-[11px] font-semibold text-[#faf6ec] bg-[#2d3d2a] hover:bg-[#22301f] rounded-[14px] px-2.5 py-1 disabled:opacity-50 transition-colors"
                      >
                        Añadir
                      </button>
                    </div>
                  )}
                </div>
                );
              })()}
            </div>

            {/* Categoría */}
            <div>
              <label
                htmlFor="categoria"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Categoría
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors h-9"
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccionar categoría</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Proveedor */}
            <div className="relative" ref={provPresetsRef}>
              <label
                htmlFor="proveedor"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Proveedor
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="proveedor"
                  value={proveedor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProveedor(val);
                  }}
                  placeholder="Nombre del proveedor"
                  className="w-full bg-white border border-[#E9E2CE] rounded-[14px] px-3 pr-10 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowProvPresets((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-[14px] text-[#4d6547] hover:bg-[#FBF8EF] transition-colors"
                  aria-label="Mostrar proveedores guardados"
                  title="Proveedores guardados"
                  disabled={isSubmitting}
                >
                  <ChevronDown
                    className={`w-4 h-4 text-[#2d5016] transition-transform ${showProvPresets ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {/* Proveedor presets popup */}
              {showProvPresets && (() => {
                const q = proveedor.trim().toLowerCase();
                const visible = q
                  ? provPresets.filter((p) => p.name.toLowerCase().includes(q))
                  : provPresets;
                return (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[14px] shadow-lg z-50 max-h-60 flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    {visible.length > 0 ? (
                      <ul className="py-1">
                        {visible.map((preset) => (
                          <li
                            key={preset.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setProveedor(preset.name);
                                setShowProvPresets(false);
                              }}
                              className="flex-1 text-left text-sm text-[#1a1a1a]"
                            >
                              {preset.name}
                            </button>
                            {canManagePresets && (
                              <button
                                type="button"
                                onClick={() => handleDeleteProvPreset(preset.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm text-gray-400">
                        {q ? "Sin coincidencias" : "Sin proveedores guardados"}
                      </p>
                    )}
                  </div>
                  {canManagePresets && (
                    <div className="shrink-0 border-t border-gray-200 px-3 py-2 flex gap-2">
                      <input
                        type="text"
                        value={newProvPreset}
                        onChange={(e) => setNewProvPreset(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddProvPreset(); } }}
                        placeholder="Nuevo proveedor..."
                        className="flex-1 text-sm bg-gray-50 rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#2d5016]/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddProvPreset}
                        disabled={!newProvPreset.trim() || addingProvPreset}
                        className="text-[11px] font-semibold text-[#faf6ec] bg-[#2d3d2a] hover:bg-[#22301f] rounded-[14px] px-2.5 py-1 disabled:opacity-50 transition-colors"
                      >
                        Añadir
                      </button>
                    </div>
                  )}
                </div>
                );
              })()}
            </div>

            {/* Monto */}
            <div>
              <label
                htmlFor="saldo"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Saldo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#1a1a1a]">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  id="saldo"
                  value={saldo}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Allow digits, dots (thousands), and comma (decimal)
                    const cleaned = input.replace(/[^0-9.,]/g, "");
                    // Strip thousand separators (dots), keep comma as decimal
                    const raw = cleaned.replace(/\./g, "");
                    if (!raw) { setSaldo(""); return; }
                    // Split on comma to preserve decimal part
                    const parts = raw.split(",");
                    const intPart = parts[0].replace(/[^0-9]/g, "");
                    if (!intPart && !parts[1]) { setSaldo(""); return; }
                    const formatted = Number(intPart || 0).toLocaleString("es-AR");
                    setSaldo(parts.length > 1 ? `${formatted},${parts[1]}` : formatted);
                  }}
                  placeholder="0"
                  className="w-full bg-white border border-[#E9E2CE] rounded-[14px] pl-8 pr-4 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Comprobante (optional file upload) */}
            <div>
              <label
                htmlFor="comprobante-file-form"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Comprobante <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-[14px] p-4 text-center hover:border-[#2d5016] transition-colors">
                <input
                  type="file"
                  id="comprobante-file-form"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="comprobante-file-form"
                  className="cursor-pointer flex flex-col items-center gap-1"
                >
                  <FileText className="w-6 h-6 text-gray-400" />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600">
                        PDF o imagen — Máximo 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Quitar archivo
                </button>
              )}
            </div>

            {/* Factura (optional file upload) */}
            <div>
              <label
                htmlFor="factura-file-form"
                className="block text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-1.5"
              >
                Factura <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-[14px] p-4 text-center hover:border-[#2d5016] transition-colors">
                <input
                  type="file"
                  id="factura-file-form"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFacturaFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="factura-file-form"
                  className="cursor-pointer flex flex-col items-center gap-1"
                >
                  <FileText className="w-6 h-6 text-gray-400" />
                  {facturaFile ? (
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{facturaFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(facturaFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600">
                        PDF o imagen — Máximo 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              {facturaFile && (
                <button
                  type="button"
                  onClick={() => setFacturaFile(null)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Quitar archivo
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[14px] p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-dashed border-[#E9E2CE]">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!concepto.trim() || !categoria || !proveedor.trim() || !saldo.trim() || !fecha || isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#faf6ec] border-t-transparent rounded-full animate-spin" />
                    Agregando…
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
