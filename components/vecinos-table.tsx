"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Filter, Download, Pencil, ChevronUp, ChevronDown, Eye, X, Upload } from "lucide-react";
import { DownloadVecinosPdfModal } from "@/components/download-vecinos-pdf-modal";
import { AddVecinoButton } from "@/components/add-vecino-button";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function getArgDate(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
}

interface VecinoData {
  id?: string;
  lote: string;
  propietario: string;
  concepto: string;
  cuotas: string | null;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  fecha_pago: string | null;
  codigo: string | null;
  comprobante_url: string | null;
}

type SortField = "lote" | "propietario" | "concepto" | "cargo" | "pago" | "saldo";
type EditField = "pago" | "cargo" | "saldo" | "fecha_pago" | "cuotas" | "lote" | "propietario" | "concepto";
type SortDirection = "asc" | "desc";

interface VecinosTableProps {
  refreshTrigger?: number;
  initialData?: VecinoData[];
  readOnly?: boolean;
  showAddButton?: boolean;
}

// Compute estado matching mi panel logic (saldo-status-display)
function computeEstadoVecino(cargo: number, pago: number, saldo: number): { label: string; color: string } {
  if (cargo === 0 && pago === 0) return { label: "-", color: "text-gray-400" };
  if (saldo <= 0) return { label: "Al día", color: "text-green-600" };
  // Rolled-over debt (saldo greater than the current period's cargo) is
  // always Deudor, regardless of day of month.
  if (saldo > cargo) return { label: "Deudor", color: "text-red-600" };
  const argDay = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getDate();
  if (argDay <= 5) return { label: "A pagar", color: "text-green-600" };
  if (argDay <= 10) return { label: "A término", color: "text-orange-500" };
  return { label: "Deudor", color: "text-red-600" };
}

export function VecinosTable({ refreshTrigger, initialData, readOnly: readOnlyProp = false, showAddButton = false }: VecinosTableProps = {}) {
  const [vecinos, setVecinos] = useState<VecinoData[]>(initialData || []);
  const [allVecinos, setAllVecinos] = useState<VecinoData[]>(initialData || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(!initialData);

  // Period filter: month (1-12) and year. Default = current Argentina month/year.
  const [filterMonth, setFilterMonth] = useState<number | null>(() => getArgDate().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(() => getArgDate().getFullYear());
  const [filterEstado, setFilterEstado] = useState<"todos" | "deudores" | "al-dia">("todos");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // True only when the filter points at the live Argentina-time month.
  const isCurrentPeriod = useMemo(() => {
    if (filterMonth === null) return false;
    const now = getArgDate();
    return filterMonth === now.getMonth() + 1 && filterYear === now.getFullYear();
  }, [filterMonth, filterYear]);
  const isAllMonths = filterMonth === null;

  // Users with finance.vecinos.edit can edit live ingresos and historical
  // ingresos snapshots. The all-months history view spans many real rows, so it is always
  // read-only.
  const readOnly = readOnlyProp || isAllMonths;

  // Auto-advance the default filter when the calendar rolls — but only if the
  // user hasn't manually moved it off the prior "current" period.
  useEffect(() => {
    const onFocus = () => {
      const now = getArgDate();
      const liveMonth = now.getMonth() + 1;
      const liveYear = now.getFullYear();
      setFilterMonth((prevMonth) => {
        if (prevMonth === null) return prevMonth;
        setFilterYear((prevYear) => {
          // If still on what used to be the current period, advance.
          // If user picked a past period, leave it alone.
          if (prevMonth === liveMonth && prevYear === liveYear) return prevYear;
          // Detect "previously-current" by comparing the saved default to live.
          // Simpler: if filter is in the past, leave; if filter == live, leave.
          // Auto-advance only when filter year/month is now strictly behind live.
          if (prevYear < liveYear || (prevYear === liveYear && prevMonth < liveMonth)) return prevYear;
          return prevYear;
        });
        return prevMonth;
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Year list: current ± a couple of years, plus any year present in fetched data.
  const availableYears = useMemo(() => {
    const now = getArgDate().getFullYear();
    const set = new Set<number>([now - 2, now - 1, now, now + 1]);
    set.add(filterYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [filterYear]);

  // Close the filter popover on outside click
  useEffect(() => {
    if (!isFilterOpen) return;
    const onDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isFilterOpen]);

  const [editingFields, setEditingFields] = useState<Map<string, string>>(new Map());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortField, setSortField] = useState<SortField>("lote");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [uploadingVecinoId, setUploadingVecinoId] = useState<string | null>(null);
  const [confirmDeleteComprobante, setConfirmDeleteComprobante] = useState<string | null>(null);
  const [deletingComprobante, setDeletingComprobante] = useState(false);

  // When the filter switches periods, drop any in-flight edits and exit edit mode.
  useEffect(() => {
    setIsEditMode(false);
    setEditingFields(new Map());
    setEditingCell(null);
  }, [filterMonth, filterYear]);

  const handleDeleteComprobante = async (vecinoId: string) => {
    if (isAllMonths) return;
    setDeletingComprobante(true);
    try {
      const res = await fetch("/api/vecinos/delete-comprobante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vecinoId, history: !isCurrentPeriod }),
      });
      const result = await res.json();
      if (result.success) {
        const update = (list: VecinoData[]) => list.map(v => v.id === vecinoId ? { ...v, comprobante_url: null } : v);
        setVecinos(update);
        setAllVecinos(update);
      } else {
        alert(result.error || "Error al eliminar el comprobante");
      }
    } catch (err) {
      console.error("Error deleting comprobante:", err);
      alert("Error al eliminar el comprobante");
    } finally {
      setDeletingComprobante(false);
      setConfirmDeleteComprobante(null);
    }
  };

  const handleComprobanteUpload = async (vecinoId: string, file: File) => {
    if (isAllMonths) return;
    setUploadingVecinoId(vecinoId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vecinoId", vecinoId);
      if (!isCurrentPeriod) formData.append("history", "true");
      const res = await fetch("/api/vecinos/upload-comprobante", { method: "POST", body: formData });
      const result = await res.json();
      if (result.success && result.comprobante_url) {
        const update = (list: VecinoData[]) => list.map(v => v.id === vecinoId ? { ...v, comprobante_url: result.comprobante_url } : v);
        setVecinos(update);
        setAllVecinos(update);
      }
    } catch (err) {
      console.error("Error uploading comprobante:", err);
    } finally {
      setUploadingVecinoId(null);
    }
  };

  useEffect(() => {
    // We have initialData (current period only) and we're still pointing at the
    // current period — skip the fetch unless something explicitly triggers it.
    if (initialData && !refreshTrigger && isCurrentPeriod && reloadNonce === 0) {
      setVecinos(initialData);
      setAllVecinos(initialData);
      return;
    }
    async function fetchVecinos() {
      setLoading(true);
      try {
        // Todos → grouped all-period history. Past period → vecinos_history snapshots.
        // Current period → live vecinos.
        const url = isAllMonths
          ? "/api/admin/vecinos-history?all=1"
          : isCurrentPeriod
          ? "/api/vecinos"
          : `/api/admin/vecinos-history?year=${filterYear}&month=${filterMonth}`;
        const response = await fetch(url);
        const result = await response.json();

        console.log("API response:", result);

        if (result.error) {
          console.error("API error:", result.error);
          setLoading(false);
          return;
        }

        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          console.log("API data received:", result.data.length, "rows");
          console.log("First row from API:", result.data[0]);

          const firstRow = result.data[0];
          const isAlreadyTransformed =
            (typeof firstRow.cargo === 'number' || (typeof firstRow.cargo === 'string' && firstRow.cargo !== "")) &&
            (typeof firstRow.pago === 'number' || (typeof firstRow.pago === 'string' && firstRow.pago !== "")) &&
            (typeof firstRow.saldo === 'number' || (typeof firstRow.saldo === 'string' && firstRow.saldo !== "")) &&
            firstRow.propietario !== undefined &&
            !firstRow[" Mes corriente "] &&
            !firstRow[" Cobrado "];

          let transformed: VecinoData[];

          if (isAlreadyTransformed) {
            console.log("Data is already transformed from database - using directly");
            transformed = result.data.map((row: Record<string, unknown>) => {
              const cargo = typeof row.cargo === 'number' ? row.cargo : parseFloat(String(row.cargo || 0)) || 0;
              const pago = typeof row.pago === 'number' ? row.pago : parseFloat(String(row.pago || 0)) || 0;
              const saldo = typeof row.saldo === 'number' ? row.saldo : parseFloat(String(row.saldo || 0)) || 0;

              const getCurrentMonthName = () => {
                const months = [
                  "enero", "febrero", "marzo", "abril", "mayo", "junio",
                  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
                ];
                const monthName = months[new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getMonth()];
                return monthName.charAt(0).toUpperCase() + monthName.slice(1);
              };
              const defaultConcepto = `Cuota de ${getCurrentMonthName()}`;
              const periodMonth = typeof row.period_month === "number" ? row.period_month : parseInt(String(row.period_month || ""), 10);
              const periodYear = typeof row.period_year === "number" ? row.period_year : parseInt(String(row.period_year || ""), 10);
              const periodLabel = isAllMonths && periodMonth >= 1 && periodMonth <= 12 && Number.isFinite(periodYear)
                ? `${MONTH_NAMES[periodMonth - 1].charAt(0).toUpperCase() + MONTH_NAMES[periodMonth - 1].slice(1)} ${periodYear}`
                : null;
              const concepto = String(row.concepto || defaultConcepto);

              return {
                id: row.id || "",
                lote: String(row.lote || ""),
                propietario: String(row.propietario || ""),
                concepto: periodLabel ? `${periodLabel} - ${concepto}` : concepto,
                cuotas: (row.cuotas as string) || null,
                cargo: cargo,
                pago: pago,
                saldo: saldo,
                estado: computeEstadoVecino(cargo, pago, saldo).label,
                fecha_pago: (row.fecha_pago as string) || null,
                codigo: (row.codigo as string) || null,
                comprobante_url: (row.comprobante_url as string) || null,
              };
            });
          } else {
            console.log("Transforming Excel data format");
            transformed = result.data.map((row: Record<string, unknown>) => {
              const mesCorriente = parseFloat(String(row[" Mes corriente "] || row["Mes corriente"] || row["Mes Corriente"] || 0)) || 0;
              const saldoAnterior = parseFloat(String(row[" Saldo Anterior "] || row["Saldo Anterior"] || row["Saldo anterior"] || 0)) || 0;
              const pago = parseFloat(String(row[" Cobrado "] || row["Cobrado"] || row["cobrado"] || 0)) || 0;
              const adeudado = parseFloat(String(row[" Adeudado "] || row["Adeudado"] || row["adeudado"] || 0)) || 0;

              const cargo = mesCorriente + saldoAnterior;
              const saldo = adeudado > 0 ? adeudado : (cargo - pago);

              const loteValue = row["#"] || row["Lote"] || row["lote"] || "";
              const propietarioValue = row["Propietario"] || row["propietario"] || "";

              const getCurrentMonthName = () => {
                const months = [
                  "enero", "febrero", "marzo", "abril", "mayo", "junio",
                  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
                ];
                const monthName = months[new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getMonth()];
                return monthName.charAt(0).toUpperCase() + monthName.slice(1);
              };
              const defaultConcepto = `Cuota de ${getCurrentMonthName()}`;

              return {
                lote: String(loteValue || ""),
                propietario: String(propietarioValue || ""),
                concepto: defaultConcepto,
                cargo: cargo,
                pago: pago,
                saldo: saldo,
                estado: computeEstadoVecino(cargo, pago, saldo).label,
                fecha_pago: null,
                codigo: null,
              };
            }).filter((v: VecinoData) => v.propietario);
          }

          console.log("Transformed vecinos:", transformed);
          console.log("Transformed count:", transformed.length);

          setAllVecinos(transformed);
          setVecinos(transformed);
        } else {
          // Empty array or no data — clear the table for this period.
          setAllVecinos([]);
          setVecinos([]);
        }
      } catch (error) {
        console.error("Error fetching vecinos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVecinos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, filterMonth, filterYear, isCurrentPeriod, isAllMonths, reloadNonce]);

  useEffect(() => {
    let filtered = allVecinos;

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((vecino) => {
        const loteMatch = vecino.lote?.toLowerCase().includes(query) || false;
        const propietarioMatch = vecino.propietario?.toLowerCase().includes(query) || false;
        return loteMatch || propietarioMatch;
      });
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter((vecino) => {
        const saldo = vecino.saldo || 0;
        return filterEstado === "deudores" ? saldo > 0 : saldo <= 0;
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "lote") {
        const aNum = parseInt(a.lote) || 0;
        const bNum = parseInt(b.lote) || 0;
        return (aNum - bNum) * dir;
      }
      if (sortField === "propietario" || sortField === "concepto") {
        return (a[sortField] || "").localeCompare(b[sortField] || "", "es") * dir;
      }
      return ((a[sortField] || 0) - (b[sortField] || 0)) * dir;
    });

    setVecinos(sorted);
  }, [searchQuery, allVecinos, sortField, sortDirection, filterEstado]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "lote" || field === "propietario" || field === "concepto" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    const isActive = sortField === field;
    return (
      <span className="inline-flex flex-col ml-1 -space-y-0.5">
        <ChevronUp className={`w-4 h-4 ${isActive && sortDirection === "asc" ? "text-[#2d5016]" : "text-gray-400"}`} />
        <ChevronDown className={`w-4 h-4 ${isActive && sortDirection === "desc" ? "text-[#2d5016]" : "text-gray-400"}`} />
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-AR')}`;
  };

  // Format YYYY-MM-DD -> DD/MM/YY for display
  const formatFechaPago = (date: string | null): string => {
    if (!date) return "";
    const parts = date.split("-");
    if (parts.length !== 3) return date;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
  };

  const getEditKey = (vecino: VecinoData, field: EditField) => {
    if (vecino.id) {
      return `${vecino.id}-${field}`;
    }
    return `${vecino.lote}-${vecino.propietario}-${field}`;
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditingFields(new Map());
      setEditingCell(null);
    }
    setIsEditMode(prev => !prev);
  };

  const handleEditValueChange = (vecino: VecinoData, field: EditField, value: string) => {
    const key = getEditKey(vecino, field);
    setEditingFields(prev => new Map(prev).set(key, value));
  };

  const parseArgentineNumber = (value: string): number => {
    if (!value || value.trim() === '') return 0;

    let cleaned = value.trim().replace(/[$€\s]/g, '');

    const hasComma = cleaned.includes(',');
    const hasPeriod = cleaned.includes('.');

    if (hasComma && hasPeriod) {
      const commaIndex = cleaned.indexOf(',');
      const periodIndex = cleaned.indexOf('.');

      if (commaIndex < periodIndex) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else if (hasComma) {
      const commaIndex = cleaned.indexOf(',');
      const afterComma = cleaned.substring(commaIndex + 1);
      const digitsAfterComma = afterComma.replace(/\D/g, '');

      if (digitsAfterComma.length === 3) {
        cleaned = cleaned.replace(/,/g, '');
      } else if (digitsAfterComma.length <= 2) {
        cleaned = cleaned.replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (hasPeriod) {
      const parts = cleaned.split('.');
      if (parts.length === 2 && parts[1].length <= 2 && /^\d{1,2}$/.test(parts[1])) {
        cleaned = cleaned.replace(/\./g, '');
      } else {
        cleaned = cleaned.replace(/\./g, '');
      }
    }

    const result = parseFloat(cleaned) || 0;
    console.log(`Parsing "${value}" -> cleaned: "${cleaned}" -> result: ${result}`);
    return result;
  };

  const formatArgentineNumber = (value: number): string => {
    if (value === 0) return '0';

    const parts = value.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
  };

  const handleSaveAll = async () => {
    if (isAllMonths || isSaving || editingFields.size === 0) return;

    setIsSaving(true);

    try {
      const vecinoUpdates = new Map<string, { cargo?: number; pago?: number; saldo?: number; fecha_pago?: string; cuotas?: string; lote?: string; propietario?: string; concepto?: string; vecino: VecinoData }>();

      for (const [key, value] of editingFields.entries()) {
        const parts = key.split('-');
        const field = parts[parts.length - 1] as EditField;

        const vecino = allVecinos.find(v => getEditKey(v, field) === key);
        if (!vecino) {
          console.error(`Vecino no encontrado para la clave: ${key}`);
          continue;
        }

        const vecinoKey = vecino.id || `${vecino.lote}-${vecino.propietario}`;
        if (!vecinoUpdates.has(vecinoKey)) {
          vecinoUpdates.set(vecinoKey, { vecino });
        }

        const update = vecinoUpdates.get(vecinoKey)!;
        if (field === "cargo") {
          update.cargo = parseArgentineNumber(value);
        } else if (field === "pago") {
          update.pago = parseArgentineNumber(value);
        } else if (field === "saldo") {
          update.saldo = parseArgentineNumber(value);
        } else if (field === "fecha_pago") {
          update.fecha_pago = value;
        } else if (field === "cuotas") {
          update.cuotas = value;
        } else if (field === "lote") {
          update.lote = value;
        } else if (field === "propietario") {
          update.propietario = value;
        } else if (field === "concepto") {
          update.concepto = value;
        }
      }

      const savePromises = Array.from(vecinoUpdates.values()).map(async (update) => {
        const { vecino, cargo, pago, saldo, fecha_pago, cuotas, lote: newLote, propietario: newPropietario, concepto } = update;

        const updateData: { cargo?: number; pago?: number; saldo?: number; fecha_pago?: string; cuotas?: string; lote?: string; propietario?: string; concepto?: string } = {};
        if (cargo !== undefined) updateData.cargo = cargo;
        if (pago !== undefined) updateData.pago = pago;
        if (saldo !== undefined) updateData.saldo = saldo;
        if (fecha_pago !== undefined) updateData.fecha_pago = fecha_pago;
        if (cuotas !== undefined) updateData.cuotas = cuotas;
        if (newLote !== undefined) updateData.lote = newLote;
        if (newPropietario !== undefined) updateData.propietario = newPropietario;
        if (concepto !== undefined) updateData.concepto = concepto;

        const response = await fetch(isCurrentPeriod ? "/api/vecinos/update" : "/api/admin/vecinos-history", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: vecino.id || undefined,
            lote: vecino.lote,
            propietario: vecino.propietario,
            ...updateData,
          }),
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      });

      await Promise.all(savePromises);

      setEditingFields(new Map());
      setIsEditMode(false);
      setReloadNonce((n) => n + 1);
    } catch (error) {
      console.error("Error updating vecinos:", error);
      alert("Error al actualizar los valores. Por favor intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = (vecino: VecinoData, field: EditField) => {
    const key = getEditKey(vecino, field);
    if (editingCell !== key) return;
    const currentValue = editingFields.get(key) ?? "";
    let hasChanged: boolean;
    if (field === "fecha_pago") {
      hasChanged = currentValue !== (vecino.fecha_pago ?? "");
    } else if (field === "cuotas") {
      hasChanged = currentValue !== (vecino.cuotas ?? "");
    } else if (field === "lote") {
      hasChanged = currentValue !== vecino.lote;
    } else if (field === "propietario") {
      hasChanged = currentValue !== vecino.propietario;
    } else if (field === "concepto") {
      hasChanged = currentValue !== vecino.concepto;
    } else {
      const originalNum = field === "cargo" ? vecino.cargo : field === "pago" ? vecino.pago : vecino.saldo;
      hasChanged = parseArgentineNumber(currentValue) !== originalNum;
    }
    setEditingCell(null);
    if (!hasChanged) {
      setEditingFields(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, vecino: VecinoData, field: EditField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSaveAll();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      const key = getEditKey(vecino, field);
      setEditingCell(null);
      setEditingFields(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar with edit mode toggle */}
      <div className="flex items-center gap-2 mb-3">
        {!readOnly && (
          <button
            onClick={toggleEditMode}
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
          <button
            type="button"
            onClick={() => setIsFilterOpen((v) => !v)}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-[14px] transition-colors z-10 ${
              isAllMonths || !isCurrentPeriod || filterEstado !== "todos" ? "bg-[#2d5016]/10 text-[#2d5016]" : "text-[#4d6547] hover:bg-[#eef1ea]"
            }`}
            title="Filtrar por mes, año y estado"
          >
            <Filter className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por lote o propietario…"
            className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-11 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          />
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Mes</label>
                <select
                  value={filterMonth ?? ""}
                  onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                >
                  <option value="">Todos</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Año</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
                  disabled={isAllMonths}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors disabled:opacity-50"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Estado</label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value as "todos" | "deudores" | "al-dia")}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                >
                  <option value="todos">Todos</option>
                  <option value="deudores">Deudores</option>
                  <option value="al-dia">Al día</option>
                </select>
              </div>
              {(isAllMonths || !isCurrentPeriod || filterEstado !== "todos") && (
                <button
                  onClick={() => {
                    const now = getArgDate();
                    setFilterMonth(now.getMonth() + 1);
                    setFilterYear(now.getFullYear());
                    setFilterEstado("todos");
                  }}
                  className="px-2 py-0.5 rounded-[14px] text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Restablecer
                </button>
              )}
            </div>
          )}
        </div>
        {showAddButton && !isAllMonths && filterMonth !== null && (
          <AddVecinoButton
            targetPeriod={{ year: filterYear, month: filterMonth, isCurrent: isCurrentPeriod }}
            onAdd={() => setReloadNonce((n) => n + 1)}
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
      <div className="overflow-auto h-[480px]">
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-[#e7ebe1] border-b border-[#E9E2CE]">
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] whitespace-nowrap">FECHA</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] whitespace-nowrap">CÓDIGO</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("lote")}>
              <span className="inline-flex items-center justify-center gap-1">LOTE<SortIcon field="lote" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("propietario")}>
              <span className="inline-flex items-center justify-center gap-1">PROPIETARIO<SortIcon field="propietario" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("concepto")}>
              <span className="inline-flex items-center justify-center gap-1">CONCEPTO<SortIcon field="concepto" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">CUOTAS</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("cargo")}>
              <span className="inline-flex items-center justify-center gap-1">CARGO<SortIcon field="cargo" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("pago")}>
              <span className="inline-flex items-center justify-center gap-1">PAGO<SortIcon field="pago" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/15 transition-colors" onClick={() => handleSort("saldo")}>
              <span className="inline-flex items-center justify-center gap-1">SALDO<SortIcon field="saldo" /></span>
            </th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">ESTADO</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">COMPROBANTE</th>
          </tr>
        </thead>
        <tbody>
          {vecinos.length > 0 ? (
            <>
              {vecinos.map((vecino, index) => {
                const cargoKey = getEditKey(vecino, "cargo");
                const pagoKey = getEditKey(vecino, "pago");

                const fechaKey = getEditKey(vecino, "fecha_pago");

                return (
                  <tr key={vecino.id || index} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] whitespace-nowrap">
                      {isEditMode ? (
                        <input
                          type="date"
                          value={editingFields.has(fechaKey) ? (editingFields.get(fechaKey) ?? "") : (vecino.fecha_pago ?? "")}
                          onChange={(e) => handleEditValueChange(vecino, "fecha_pago", e.target.value)}
                          onFocus={() => setEditingCell(fechaKey)}
                          onBlur={() => handleBlur(vecino, "fecha_pago")}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "fecha_pago")}
                          className="w-32 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          disabled={isSaving}
                        />
                      ) : (
                        <span>{formatFechaPago(vecino.fecha_pago)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] font-mono">
                      {vecino.codigo || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingFields.has(getEditKey(vecino, "lote")) ? (editingFields.get(getEditKey(vecino, "lote")) ?? "") : vecino.lote}
                          onChange={(e) => handleEditValueChange(vecino, "lote", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "lote")}
                          onFocus={() => setEditingCell(getEditKey(vecino, "lote"))}
                          onBlur={() => handleBlur(vecino, "lote")}
                          className="w-16 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          disabled={isSaving}
                        />
                      ) : (
                        vecino.lote
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingFields.has(getEditKey(vecino, "propietario")) ? (editingFields.get(getEditKey(vecino, "propietario")) ?? "") : vecino.propietario}
                          onChange={(e) => handleEditValueChange(vecino, "propietario", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "propietario")}
                          onFocus={() => setEditingCell(getEditKey(vecino, "propietario"))}
                          onBlur={() => handleBlur(vecino, "propietario")}
                          className="w-full text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          disabled={isSaving}
                        />
                      ) : (
                        vecino.propietario
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingFields.has(getEditKey(vecino, "concepto")) ? (editingFields.get(getEditKey(vecino, "concepto")) ?? "") : vecino.concepto}
                          onChange={(e) => handleEditValueChange(vecino, "concepto", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "concepto")}
                          onFocus={() => setEditingCell(getEditKey(vecino, "concepto"))}
                          onBlur={() => handleBlur(vecino, "concepto")}
                          className="w-full text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          disabled={isSaving}
                        />
                      ) : (
                        vecino.concepto
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editingFields.has(getEditKey(vecino, "cuotas")) ? (editingFields.get(getEditKey(vecino, "cuotas")) ?? "") : (vecino.cuotas || "")}
                          onChange={(e) => handleEditValueChange(vecino, "cuotas", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "cuotas")}
                          onFocus={() => setEditingCell(getEditKey(vecino, "cuotas"))}
                          onBlur={() => handleBlur(vecino, "cuotas")}
                          className="w-20 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          placeholder="-"
                          disabled={isSaving}
                        />
                      ) : (
                        <span>{vecino.cuotas || "-"}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingFields.has(cargoKey) ? (editingFields.get(cargoKey) ?? "") : formatArgentineNumber(vecino.cargo)}
                          onChange={(e) => handleEditValueChange(vecino, "cargo", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "cargo")}
                          onFocus={() => setEditingCell(cargoKey)}
                          onBlur={() => handleBlur(vecino, "cargo")}
                          className="w-32 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          placeholder="0"
                          disabled={isSaving}
                        />
                      ) : (
                        <span>{formatCurrency(vecino.cargo)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a]">
                      {isEditMode ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingFields.has(pagoKey) ? (editingFields.get(pagoKey) ?? "") : formatArgentineNumber(vecino.pago)}
                          onChange={(e) => handleEditValueChange(vecino, "pago", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "pago")}
                          onFocus={() => setEditingCell(pagoKey)}
                          onBlur={() => handleBlur(vecino, "pago")}
                          className="w-32 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          placeholder="0"
                          disabled={isSaving}
                        />
                      ) : (
                        <span>{formatCurrency(vecino.pago)}</span>
                      )}
                    </td>
                    <td className={`px-3 py-2 text-xs text-center font-medium ${vecino.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {isEditMode ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editingFields.has(getEditKey(vecino, "saldo")) ? (editingFields.get(getEditKey(vecino, "saldo")) ?? "") : formatArgentineNumber(vecino.saldo)}
                          onChange={(e) => handleEditValueChange(vecino, "saldo", e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, vecino, "saldo")}
                          onFocus={() => setEditingCell(getEditKey(vecino, "saldo"))}
                          onBlur={() => handleBlur(vecino, "saldo")}
                          className="w-32 text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                          placeholder="0"
                          disabled={isSaving}
                        />
                      ) : (
                        <span>{formatCurrency(vecino.saldo)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center">
                      {(() => {
                        const e = isAllMonths
                          ? {
                              label: vecino.cargo === 0 && vecino.pago === 0 ? "-" : vecino.saldo > 0 ? "Deudor" : "Al día",
                              color: vecino.cargo === 0 && vecino.pago === 0 ? "text-gray-400" : vecino.saldo > 0 ? "text-red-600" : "text-green-600",
                            }
                          : computeEstadoVecino(vecino.cargo, vecino.pago, vecino.saldo);
                        if (e.label === "-") {
                          return <span className="text-gray-400">-</span>;
                        }
                        const pillBg =
                          e.label === "Al día" || e.label === "A pagar"
                            ? "bg-green-50 text-green-700"
                            : e.label === "A término"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-red-50 text-red-700";
                        return (
                          <span className={`inline-flex items-center justify-center min-w-[3.75rem] px-2 py-0.5 rounded-[14px] text-[10px] font-semibold whitespace-nowrap ${pillBg}`}>
                            {e.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2 text-xs text-center align-middle">
                      {vecino.comprobante_url ? (
                        <div className="inline-flex items-center gap-1">
                          <a
                            href={vecino.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#2d5016] hover:text-[#3a6a1f] inline-flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          {isEditMode && vecino.id && !readOnly && (
                            <button
                              onClick={() => setConfirmDeleteComprobante(vecino.id!)}
                              className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar comprobante"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : vecino.id && !readOnly ? (
                        <label className="text-gray-400 hover:text-[#1a1a1a] transition-colors cursor-pointer inline-flex items-center justify-center" title="Subir comprobante">
                          {uploadingVecinoId === vecino.id ? <span className="text-xs">...</span> : <Upload className="w-4 h-4" />}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f && vecino.id) handleComprobanteUpload(vecino.id, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {vecinos.length < 10 && Array.from({ length: 10 - vecinos.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-200">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                  ))}
                </tr>
              ))}
            </>
          ) : (
            <>
              <tr>
                <td colSpan={11} className="px-3 py-2 text-xs text-center text-gray-400">
                  No hay datos disponibles
                </td>
              </tr>
              {Array.from({ length: 9 }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-200">
                  {Array.from({ length: 11 }).map((_, j) => (
                    <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                  ))}
                </tr>
              ))}
            </>
          )}
          {/* Totals Row */}
          <tr className="bg-[#2d5016]/10 border-t border-[#E9E2CE] font-semibold">
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
            <td className="px-3 py-2 text-[11px] uppercase tracking-wider text-center text-[#2d5016]">TOTAL</td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]">{allVecinos.length}</td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono">{formatCurrency(allVecinos.reduce((sum, v) => sum + v.cargo, 0))}</td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono">{formatCurrency(allVecinos.reduce((sum, v) => sum + v.pago, 0))}</td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016] font-mono">{formatCurrency(allVecinos.reduce((sum, v) => sum + v.saldo, 0))}</td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
            <td className="px-3 py-2 text-[11px] text-center text-[#2d5016]"></td>
          </tr>
        </tbody>
      </table>
      </div>
      </div>

      {/* Save and Download buttons */}
      <div className="mt-3 flex justify-center gap-2">
        {isEditMode && editingFields.size > 0 && (
          <button
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Guardando…" : `Guardar cambios (${editingFields.size})`}
          </button>
        )}
        <DownloadVecinosButton />
      </div>

      {/* Confirm delete comprobante modal */}
      {confirmDeleteComprobante && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-sm">
            <div className="p-6">
              <p className="text-sm text-[#1a1a1a] mb-4">
                ¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setConfirmDeleteComprobante(null)}
                disabled={deletingComprobante}
                className="px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-gray-100 rounded-[14px] hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteComprobante(confirmDeleteComprobante)}
                disabled={deletingComprobante}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-[14px] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingComprobante ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DownloadVecinosButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Descargar
      </button>
      <DownloadVecinosPdfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
