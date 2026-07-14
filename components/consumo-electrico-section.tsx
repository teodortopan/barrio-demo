"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Filter, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { getArgentinaDate, getArgentinaToday } from "@/lib/utils/argentina-date";

interface ConsumoElectricoRow {
  id: string;
  propietario: string;
  lote: string;
  pilar: boolean;
  jabalina: boolean;
  termica: boolean;
  fecha_medicion: string | null;
  numero_medidor: string | null;
  lectura: number | null;
  lectura_anterior: number | null;
}

interface Props {
  initialRows?: ConsumoElectricoRow[];
  readOnly?: boolean;
}

type BoolField = "pilar" | "jabalina" | "termica";
type EditableField = "numero_medidor" | "lectura" | "fecha_medicion";

const BOOL_FIELDS: BoolField[] = ["pilar", "jabalina", "termica"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const EMPTY_FORM = {
  propietario: "",
  lote: "",
  pilar: false,
  jabalina: false,
  termica: false,
  fecha_medicion: "",
  numero_medidor: "",
  lectura: "",
  lectura_anterior: "",
};

export function ConsumoElectricoSection({ initialRows, readOnly: readOnlyProp = false }: Props) {
  const argentinaNow = getArgentinaDate();
  const [rows, setRows] = useState<ConsumoElectricoRow[]>(initialRows ?? []);
  const [allRows, setAllRows] = useState<ConsumoElectricoRow[]>(initialRows ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(!initialRows);
  const [filterMonth, setFilterMonth] = useState(argentinaNow.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(argentinaNow.getFullYear());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isDownloadConfirmOpen, setIsDownloadConfirmOpen] = useState(false);
  const [downloadSaveToArchivos, setDownloadSaveToArchivos] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const isCurrentPeriod = useMemo(() => {
    const now = getArgentinaDate();
    return filterMonth === now.getMonth() + 1 && filterYear === now.getFullYear();
  }, [filterMonth, filterYear]);

  const readOnly = readOnlyProp || !isCurrentPeriod;

  const availableYears = useMemo(() => {
    const now = getArgentinaDate().getFullYear();
    const years = new Set([now - 2, now - 1, now, now + 1, filterYear]);
    return Array.from(years).sort((a, b) => b - a);
  }, [filterYear]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const onDown = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isFilterOpen]);

  useEffect(() => {
    if (initialRows && isCurrentPeriod) {
      const normalized = initialRows.map(normalizeRow);
      setAllRows(normalized);
      setRows(normalized);
      setLoading(false);
      return;
    }

    async function fetchRows() {
      setLoading(true);
      try {
        const url = isCurrentPeriod
          ? "/api/consumo-electrico"
          : `/api/admin/consumo-history?year=${filterYear}&month=${filterMonth}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) {
          setAllRows([]);
          setRows([]);
          return;
        }
        const rawRows = Array.isArray(data.rows) ? data.rows : Array.isArray(data.data) ? data.data : [];
        const normalized = rawRows.map(normalizeRow);
        setAllRows(normalized);
        setRows(normalized);
      } catch {
        setAllRows([]);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRows();
  }, [filterMonth, filterYear, initialRows, isCurrentPeriod]);

  useEffect(() => {
    setRows(applySearch(allRows, searchQuery));
  }, [allRows, searchQuery]);

  useEffect(() => {
    if (readOnly) setIsEditMode(false);
  }, [readOnly]);

  const closeAddModal = () => {
    if (submittingAdd) return;
    setForm({ ...EMPTY_FORM });
    setShowAdd(false);
  };

  async function refreshCurrentRows() {
    const res = await fetch("/api/consumo-electrico");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const normalized = (data.rows || []).map(normalizeRow);
    setAllRows(normalized);
    setRows(applySearch(normalized, searchQuery));
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (submittingAdd || readOnly) return;
    setSubmittingAdd(true);
    try {
      const res = await fetch("/api/consumo-electrico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propietario: form.propietario,
          lote: form.lote,
          pilar: form.pilar,
          jabalina: form.jabalina,
          termica: form.termica,
          fecha_medicion: form.fecha_medicion || null,
          numero_medidor: form.numero_medidor || null,
          lectura: form.lectura === "" ? null : Number(form.lectura),
          lectura_anterior: form.lectura_anterior === "" ? null : Number(form.lectura_anterior),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error: ${data.error || "No se pudo crear el registro"}`);
        return;
      }
      setForm({ ...EMPTY_FORM });
      setShowAdd(false);
      await refreshCurrentRows();
    } finally {
      setSubmittingAdd(false);
    }
  }

  async function updateRow(id: string, patch: Partial<ConsumoElectricoRow>) {
    if (readOnly) return;
    const key = `${id}:${Object.keys(patch).join(",")}`;
    setSavingKey(key);
    const previous = allRows;
    const nextRows = allRows.map((row) => row.id === id ? { ...row, ...patch } : row);
    setAllRows(nextRows);
    setRows(applySearch(nextRows, searchQuery));
    try {
      const res = await fetch(`/api/consumo-electrico/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Error: ${data.error || "No se pudo actualizar"}`);
        setAllRows(previous);
        setRows(applySearch(previous, searchQuery));
      }
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDelete(id: string) {
    if (readOnly) return;
    const res = await fetch(`/api/consumo-electrico/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(`Error: ${data.error || "No se pudo eliminar"}`);
      return;
    }
    const nextRows = allRows.filter((row) => row.id !== id);
    setAllRows(nextRows);
    setRows(applySearch(nextRows, searchQuery));
    setDeleteId(null);
  }

  async function handleDownloadConfirm(saveToArchivos: boolean) {
    setIsDownloadConfirmOpen(false);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/consumo-electrico/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToArchivos }),
      });
      const result = await response.json();
      if (result.error) {
        alert("Error al generar el PDF: " + result.error);
        return;
      }
      const link = document.createElement("a");
      link.href = result.pdfUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (saveToArchivos) alert("PDF generado y guardado en archivos.");
    } catch {
      alert("Error al descargar el PDF");
    } finally {
      setIsDownloading(false);
      setDownloadSaveToArchivos(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        {!readOnly && (
          <button
            onClick={() => setIsEditMode((value) => !value)}
            title={isEditMode ? "Cancelar edición" : "Editar"}
            className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-[14px] transition-colors ${
              isEditMode
                ? "bg-[#2d5016] text-white"
                : "bg-white border border-[#E9E2CE] text-[#4d6547] hover:bg-[#FBF8EF] hover:border-[#2d5016]/40"
            }`}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
        <div className="relative flex-1" ref={filterRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
          <button
            type="button"
            onClick={() => setIsFilterOpen((value) => !value)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-[14px] transition-colors z-10 ${
              !isCurrentPeriod ? "bg-[#2d5016]/10 text-[#2d5016]" : "text-[#4d6547] hover:bg-[#eef1ea]"
            }`}
            title="Filtrar por mes y año"
          >
            <Filter className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por lote o propietario…"
            className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-11 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          />
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Mes</span>
                <select value={filterMonth} onChange={(event) => setFilterMonth(parseInt(event.target.value, 10))} className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016]">
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>{capitalize(name)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Año</span>
                <select value={filterYear} onChange={(event) => setFilterYear(parseInt(event.target.value, 10))} className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016]">
                  {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              {!isCurrentPeriod && (
                <button
                  onClick={() => {
                    const now = getArgentinaDate();
                    setFilterMonth(now.getMonth() + 1);
                    setFilterYear(now.getFullYear());
                  }}
                  className="px-2 py-0.5 rounded-[14px] text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Restablecer
                </button>
              )}
            </div>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => {
              setForm((current) => ({ ...current, fecha_medicion: current.fecha_medicion || getArgentinaToday() }));
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Añadir
          </button>
        )}
      </div>

      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="overflow-auto h-[480px]">
          <table className="w-full min-w-[980px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#e7ebe1] border-b border-[#E9E2CE]">
                {["LOTE", "PROPIETARIO", "PILAR", "JABALINA", "TÉRMICA", "Nº MEDIDOR", "LECTURA (kWh)", "CONSUMO", "FECHA"].map((header) => (
                  <th key={header} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] whitespace-nowrap">{header}</th>
                ))}
                {isEditMode && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isEditMode ? 10 : 9} className="px-3 py-8 text-center text-xs text-[#4d6547]">Cargando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={isEditMode ? 10 : 9} className="px-3 py-8 text-center text-xs text-[#4d6547]">Sin registros para este período.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] font-mono">{row.lote}</td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">{row.propietario}</td>
                    {BOOL_FIELDS.map((field) => (
                      <td key={field} className="px-3 py-2 text-center">
                        {isEditMode && !readOnly ? (
                          <button
                            onClick={() => updateRow(row.id, { [field]: !row[field] })}
                            disabled={savingKey?.startsWith(`${row.id}:`)}
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-[14px] transition-colors ${row[field] ? "bg-[#2d5016] text-[#faf6ec]" : "bg-white text-gray-400 border border-[#E9E2CE]"} disabled:opacity-50`}
                            title={row[field] ? "Sí" : "No"}
                          >
                            {row[field] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className={row[field] ? "text-[#2d5016] font-semibold" : "text-gray-400"}>{row[field] ? "Sí" : "No"}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">{renderEditable(row, "numero_medidor", isEditMode && !readOnly, updateRow)}</td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">{renderEditable(row, "lectura", isEditMode && !readOnly, updateRow)}</td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] font-mono">{formatConsumo(row)}</td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] whitespace-nowrap">{renderEditable(row, "fecha_medicion", isEditMode && !readOnly, updateRow)}</td>
                    {isEditMode && (
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => setDeleteId(row.id)} className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          onClick={() => setIsDownloadConfirmOpen(true)}
          disabled={isDownloading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Descargar
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4" style={{ background: "rgba(26,38,23,0.55)", backdropFilter: "blur(4px)" }} onClick={closeAddModal}>
          <form onSubmit={handleAdd} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashed border-[#E9E2CE]">
              <h2 className="text-base font-bold uppercase text-[#1a2617]">Nuevo registro</h2>
              <button type="button" onClick={closeAddModal} className="w-8 h-8 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea]"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              <TextInput label="Propietario" value={form.propietario} onChange={(value) => setForm({ ...form, propietario: value })} required />
              <TextInput label="Lote" value={form.lote} onChange={(value) => setForm({ ...form, lote: value })} required />
              <TextInput label="Nº medidor" value={form.numero_medidor} onChange={(value) => setForm({ ...form, numero_medidor: value })} />
              <TextInput label="Lectura (kWh)" type="number" value={form.lectura} onChange={(value) => setForm({ ...form, lectura: value })} />
              <TextInput label="Lectura anterior" type="number" value={form.lectura_anterior} onChange={(value) => setForm({ ...form, lectura_anterior: value })} />
              <TextInput label="Fecha" type="date" value={form.fecha_medicion} onChange={(value) => setForm({ ...form, fecha_medicion: value })} />
              <div className="col-span-2 grid grid-cols-3 gap-2">
                {BOOL_FIELDS.map((field) => (
                  <label key={field} className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#E9E2CE] rounded-[14px] text-xs font-semibold text-[#1a2617]">
                    {field === "termica" ? "Térmica" : capitalize(field)}
                    <input type="checkbox" checked={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.checked })} className="w-4 h-4 accent-[#2d5016]" />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-dashed border-[#E9E2CE]">
              <button type="button" onClick={closeAddModal} className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] text-xs font-medium">Cancelar</button>
              <button type="submit" disabled={submittingAdd} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold disabled:opacity-50">
                {submittingAdd && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4" style={{ background: "rgba(26,38,23,0.55)", backdropFilter: "blur(4px)" }} onClick={() => setDeleteId(null)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-xl p-5">
            <h3 className="text-sm font-bold uppercase text-[#1a2617] mb-2">¿Eliminar registro?</h3>
            <p className="text-xs text-[#3c3c3c] mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] text-xs font-medium">Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {isDownloadConfirmOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center p-4" style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]" style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}>
              <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10"><Download className="w-5 h-5 text-[#2d5016]" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Consumo eléctrico</div>
                <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">Descargar PDF</h2>
              </div>
              <button onClick={() => { setIsDownloadConfirmOpen(false); setDownloadSaveToArchivos(false); }} disabled={isDownloading} className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50" aria-label="Cerrar"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5">
              <label className="flex items-center gap-2.5 cursor-pointer rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5 hover:border-[#2d5016]/40 transition-colors">
                <input type="checkbox" checked={downloadSaveToArchivos} onChange={(event) => setDownloadSaveToArchivos(event.target.checked)} className="w-4 h-4 text-[#2d5016] border-[#E9E2CE] rounded focus:ring-[#2d5016]/40" disabled={isDownloading} />
                <span className="text-xs text-[#1a2617]">Guardar copia en Archivos → Consumo eléctrico</span>
              </label>
              <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-dashed border-[#E9E2CE]">
                <button onClick={() => { setIsDownloadConfirmOpen(false); setDownloadSaveToArchivos(false); }} disabled={isDownloading} className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50">Cancelar</button>
                <button onClick={() => handleDownloadConfirm(downloadSaveToArchivos)} disabled={isDownloading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50">
                  {isDownloading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generando…</> : <><Download className="w-3.5 h-3.5" />Descargar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TextInput({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#4d6547]">{label}</span>
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full px-3 py-2 text-sm bg-white border border-[#E9E2CE] rounded-[14px] focus:outline-none focus:border-[#2d5016]" />
    </label>
  );
}

function renderEditable(row: ConsumoElectricoRow, field: EditableField, editable: boolean, updateRow: (id: string, patch: Partial<ConsumoElectricoRow>) => Promise<void>) {
  const value = row[field];
  if (!editable) {
    if (field === "lectura") return formatNumber(value as number | null);
    return value || "";
  }
  return (
    <input
      type={field === "lectura" ? "number" : field === "fecha_medicion" ? "date" : "text"}
      defaultValue={value === null ? "" : String(value)}
      onBlur={(event) => {
        const nextValue = event.currentTarget.value;
        if (field === "lectura") {
          updateRow(row.id, { lectura: nextValue === "" ? null : Number(nextValue) });
        } else if (field === "numero_medidor") {
          updateRow(row.id, { numero_medidor: nextValue || null });
        } else {
          updateRow(row.id, { fecha_medicion: nextValue || null });
        }
      }}
      className="w-full min-w-[110px] px-2 py-1 text-xs text-center bg-white border border-[#E9E2CE] rounded-[10px] focus:outline-none focus:border-[#2d5016]"
    />
  );
}

function normalizeRow(rawRow: unknown): ConsumoElectricoRow {
  const row = rawRow as Record<string, unknown>;
  return {
    id: String(row.id || ""),
    propietario: String(row.propietario || ""),
    lote: String(row.lote || ""),
    pilar: row.pilar === true,
    jabalina: row.jabalina === true,
    termica: row.termica === true,
    fecha_medicion: (row.fecha_medicion as string) || null,
    numero_medidor: (row.numero_medidor as string) || null,
    lectura: parseNullableNumber(row.lectura),
    lectura_anterior: parseNullableNumber(row.lectura_anterior),
  };
}

function applySearch(rows: ConsumoElectricoRow[], query: string): ConsumoElectricoRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return rows;
  return rows.filter((row) =>
    row.lote.toLowerCase().includes(normalizedQuery) ||
    row.propietario.toLowerCase().includes(normalizedQuery)
  );
}

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number | null): string {
  return value === null ? "" : value.toLocaleString("es-AR");
}

function formatConsumo(row: ConsumoElectricoRow): string {
  if (row.lectura === null || row.lectura_anterior === null || row.lectura < row.lectura_anterior) return "";
  return (row.lectura - row.lectura_anterior).toLocaleString("es-AR");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
