"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Filter, Plus, Pencil, Download, X, Loader2 } from "lucide-react";
import { PaginatedExpensesTable, parseSaldoToNumber, type ExpenseSortField, type ExpenseSortDirection } from "./paginated-expenses-table";
import { AddExpenseForm } from "./add-expense-form";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { ComprobanteUploadModal } from "./comprobante-upload-modal";
import { computeEstado } from "@/lib/expenses/estado";

type EstadoFilter = "all" | "Pendiente" | "Vencido" | "Pagado";

interface ExpenseRow {
  id?: string;
  fecha: string;
  vencimiento: string;
  concepto: string;
  categoria: string;
  proveedor: string;
  saldo: string;
  comprobante: string;
  factura: string;
  estado: string;
  created_at?: string;
}

interface ExpensesSectionProps {
  initialRows?: ExpenseRow[];
  itemsPerPage?: number;
  readOnly?: boolean;
  canCreate?: boolean;
  canManage?: boolean;
}

export function ExpensesSection({
  initialRows,
  itemsPerPage = 999,
  readOnly = false,
  canCreate,
  canManage,
}: ExpensesSectionProps) {
  const allowManage = canManage ?? !readOnly;
  const allowCreate = canCreate ?? allowManage;
  const [rows, setRows] = useState<ExpenseRow[]>(initialRows ?? []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(initialRows === undefined);
  const [comprobanteExpense, setComprobanteExpense] = useState<{ id: string; concepto: string } | null>(null);
  const [isComprobanteModalOpen, setIsComprobanteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFields, setEditingFields] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadConfirmOpen, setIsDownloadConfirmOpen] = useState(false);
  const [downloadSaveToArchivos, setDownloadSaveToArchivos] = useState(false);
  const [confirmDeleteComprobante, setConfirmDeleteComprobante] = useState<number | null>(null);
  const [deletingComprobante, setDeletingComprobante] = useState(false);
  const [facturaExpense, setFacturaExpense] = useState<{ id: string; concepto: string } | null>(null);
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [confirmDeleteFactura, setConfirmDeleteFactura] = useState<number | null>(null);
  const [deletingFactura, setDeletingFactura] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const _now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const [filterMonth, setFilterMonth] = useState<number | null>(_now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number | null>(_now.getFullYear());
  const [filterEstado, setFilterEstado] = useState<EstadoFilter>("all");
  const [sortField, setSortField] = useState<ExpenseSortField>("fecha");
  const [sortDirection, setSortDirection] = useState<ExpenseSortDirection>("desc");
  const filterRef = useRef<HTMLDivElement>(null);

  const handleSort = (field: ExpenseSortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      const stringFields: ExpenseSortField[] = ["concepto", "categoria", "proveedor"];
      setSortDirection(stringFields.includes(field) ? "asc" : "desc");
    }
  };

  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const response = await fetch("/api/expenses");
        const result = await response.json();

        if (result.error) {
          console.error("Error fetching expenses:", result.error);
        } else {
          setRows(result.expenses || []);
        }
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    }

    if (initialRows === undefined) {
      fetchExpenses();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-update overdue expenses to "Vencido" in the DB
  useEffect(() => {
    if (!allowManage) return;
    if (loading) return;
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    today.setHours(0, 0, 0, 0);

    const overdue = rows.filter((r) => {
      if (!r.id || !r.vencimiento || r.estado === "Pagado" || r.estado === "Vencido") return false;
      const venc = new Date(r.vencimiento + "T00:00:00");
      return !isNaN(venc.getTime()) && today > venc;
    });

    if (overdue.length === 0) return;

    // Update local state immediately
    setRows((prev) =>
      prev.map((r) => (overdue.some((o) => o.id === r.id) ? { ...r, estado: "Vencido" } : r))
    );

    // Persist to DB
    overdue.forEach((r) => {
      fetch("/api/expenses/update-estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, estado: "Vencido" }),
      }).catch((err) => console.error("Error auto-updating estado:", err));
    });
  }, [allowManage, loading, rows]);

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // Derive available years from data, always include current year
  const currentYear = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getFullYear();
  const availableYears = Array.from(
    new Set([
      currentYear,
      ...rows.map((r) => {
        const m = r.fecha?.match(/^(\d{4})/);
        return m ? parseInt(m[1]) : null;
      }).filter((y): y is number => y !== null),
    ])
  ).sort((a, b) => b - a);

  const filteredRows = rows.filter((r) => {
    // Estado filter takes precedence: when an estado is selected, ignore the
    // month/year filter so overdue items from prior months stay visible.
    if (filterEstado !== "all") {
      if (computeEstado(r.estado, r.vencimiento) !== filterEstado) return false;
    } else if (filterMonth !== null || filterYear !== null) {
      const m = r.fecha?.match(/^(\d{4})-(\d{2})/);
      if (m) {
        const y = parseInt(m[1]);
        const mo = parseInt(m[2]);
        if (filterYear !== null && y !== filterYear) return false;
        if (filterMonth !== null && mo !== filterMonth) return false;
      } else {
        return false;
      }
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.concepto.toLowerCase().includes(q) ||
      r.proveedor.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q) ||
      r.saldo.toLowerCase().includes(q)
    );
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortField === "fecha" || sortField === "vencimiento") {
      const av = a[sortField] || "";
      const bv = b[sortField] || "";
      const cmp = av.localeCompare(bv);
      if (cmp !== 0) return cmp * dir;
      // Tie-break by created_at desc (more recently added shows higher)
      const ac = a.created_at || "";
      const bc = b.created_at || "";
      return bc.localeCompare(ac);
    }
    if (sortField === "saldo") {
      return (parseSaldoToNumber(a.saldo) - parseSaldoToNumber(b.saldo)) * dir;
    }
    return (a[sortField] || "").localeCompare(b[sortField] || "", "es") * dir;
  });

  const refreshExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      const result = await response.json();
      if (!result.error) {
        setRows(result.expenses || []);
      }
    } catch (error) {
      console.error("Error refreshing expenses:", error);
    }
  };

  const handleAddExpense = async (expense: {
    concepto: string;
    categoria: string;
    proveedor: string;
    saldo: string;
    fecha: string;
    vencimiento: string;
    file?: File | null;
    facturaFile?: File | null;
  }): Promise<void> => {
    const response = await fetch("/api/expenses/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concepto: expense.concepto,
        categoria: expense.categoria,
        proveedor: expense.proveedor,
        saldo: expense.saldo,
        fecha: expense.fecha,
        vencimiento: expense.vencimiento || null,
      }),
    });

    const result = await response.json();

    if (result.error) {
      console.error("Error creating expense:", result.error);
      throw new Error(result.error || "Error al crear el gasto");
    }

    const uploadWarnings: string[] = [];

    if (expense.file && result.expense?.id) {
      try {
        const formData = new FormData();
        formData.append("file", expense.file);
        formData.append("expenseId", result.expense.id);

        const uploadResponse = await fetch("/api/expenses/upload-comprobante", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.error) {
          console.warn("Comprobante upload failed (expense was created):", uploadResult.error);
          uploadWarnings.push("comprobante");
        }
      } catch (uploadError) {
        console.warn("Comprobante upload failed (expense was created):", uploadError);
        uploadWarnings.push("comprobante");
      }
    }

    if (expense.facturaFile && result.expense?.id) {
      try {
        const formData = new FormData();
        formData.append("file", expense.facturaFile);
        formData.append("expenseId", result.expense.id);

        const uploadResponse = await fetch("/api/expenses/upload-factura", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (uploadResult.error) {
          console.warn("Factura upload failed (expense was created):", uploadResult.error);
          uploadWarnings.push("factura");
        }
      } catch (uploadError) {
        console.warn("Factura upload failed (expense was created):", uploadError);
        uploadWarnings.push("factura");
      }
    }

    await refreshExpenses();

    if (uploadWarnings.length > 0) {
      const label = uploadWarnings.length === 2
        ? "el comprobante y la factura"
        : uploadWarnings[0] === "factura" ? "la factura" : "el comprobante";
      alert(
        `El gasto se guardó, pero no se pudo subir ${label}. ` +
        (allowManage
          ? "Podés subirlo desde la tabla haciendo click en el botón correspondiente."
          : "Avisale a administración para que lo adjunte si hace falta.")
      );
    }
  };

  const handleDeleteClick = (index: number) => {
    const expense = sortedRows[index];
    const realIndex = rows.findIndex((r) => r.id === expense?.id);
    setDeleteIndex(realIndex !== -1 ? realIndex : index);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteIndex !== null) {
      const expenseToDelete = rows[deleteIndex];

      if (!expenseToDelete.id) {
        setRows(rows.filter((_, i) => i !== deleteIndex));
        setDeleteIndex(null);
        return;
      }

      try {
        const response = await fetch(`/api/expenses/delete?id=${expenseToDelete.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (result.error) {
          console.error("Error deleting expense:", result.error);
          alert("Error al eliminar el gasto");
          return;
        }

        await refreshExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert("Error al eliminar el gasto");
      } finally {
        setDeleteIndex(null);
      }
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditingFields(new Map());
    }
    setIsEditMode((prev) => !prev);
  };

  const handleEditValueChange = useCallback((key: string, value: string) => {
    setEditingFields((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const handleRemoveEdit = useCallback((key: string) => {
    setEditingFields((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const handleSaveAll = async (pendingEdit?: { key: string; value: string }) => {
    const allEdits = new Map(editingFields);
    if (pendingEdit) allEdits.set(pendingEdit.key, pendingEdit.value);
    if (isSaving || allEdits.size === 0) return;

    setIsSaving(true);
    try {
      const byExpense = new Map<string, Record<string, string>>();
      for (const [key, value] of allEdits.entries()) {
        const [id, field] = key.split("::");
        if (!id || !field) continue;
        if (!byExpense.has(id)) byExpense.set(id, { id });
        byExpense.get(id)![field] = value;
      }

      const savePromises = Array.from(byExpense.values()).map(async (body) => {
        const response = await fetch("/api/expenses/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
      });

      await Promise.all(savePromises);
      setEditingFields(new Map());
      setIsEditMode(false);
      await refreshExpenses();
    } catch (error) {
      console.error("Error updating expenses:", error);
      alert("Error al actualizar. Por favor intenta de nuevo.");
      await refreshExpenses();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEstadoChange = async (index: number, newEstado: string) => {
    const expense = sortedRows[index];
    if (!expense?.id) return;

    const realIndex = rows.findIndex((r) => r.id === expense.id);
    if (realIndex === -1) return;

    const updatedRows = [...rows];
    updatedRows[realIndex] = { ...updatedRows[realIndex], estado: newEstado };
    setRows(updatedRows);

    try {
      const response = await fetch("/api/expenses/update-estado", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: expense.id, estado: newEstado }),
      });

      const result = await response.json();
      if (result.error) {
        console.error("Error updating estado:", result.error);
        await refreshExpenses();
      }
    } catch (error) {
      console.error("Error updating estado:", error);
      await refreshExpenses();
    }
  };

  const handleDeleteComprobante = async (index: number) => {
    setConfirmDeleteComprobante(index);
  };

  const confirmDeleteComprobanteAction = async () => {
    if (confirmDeleteComprobante === null) return;
    const expense = sortedRows[confirmDeleteComprobante];
    if (!expense?.id) return;

    setDeletingComprobante(true);
    try {
      const res = await fetch("/api/expenses/delete-comprobante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId: expense.id }),
      });
      const result = await res.json();
      if (result.success) {
        const realIndex = rows.findIndex((r) => r.id === expense.id);
        if (realIndex !== -1) {
          const updatedRows = [...rows];
          updatedRows[realIndex] = { ...updatedRows[realIndex], comprobante: "" };
          setRows(updatedRows);
        }
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

  const handleDeleteFactura = async (index: number) => {
    setConfirmDeleteFactura(index);
  };

  const confirmDeleteFacturaAction = async () => {
    if (confirmDeleteFactura === null) return;
    const expense = sortedRows[confirmDeleteFactura];
    if (!expense?.id) return;

    setDeletingFactura(true);
    try {
      const res = await fetch("/api/expenses/delete-factura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId: expense.id }),
      });
      const result = await res.json();
      if (result.success) {
        const realIndex = rows.findIndex((r) => r.id === expense.id);
        if (realIndex !== -1) {
          const updatedRows = [...rows];
          updatedRows[realIndex] = { ...updatedRows[realIndex], factura: "" };
          setRows(updatedRows);
        }
      } else {
        alert(result.error || "Error al eliminar la factura");
      }
    } catch (err) {
      console.error("Error deleting factura:", err);
      alert("Error al eliminar la factura");
    } finally {
      setDeletingFactura(false);
      setConfirmDeleteFactura(null);
    }
  };

  const handleDownloadClick = () => {
    if (filteredRows.length === 0) {
      alert("No hay datos para descargar");
      return;
    }
    setIsDownloadConfirmOpen(true);
  };

  const handleDownloadConfirm = async (saveToArchivos: boolean) => {
    setIsDownloadConfirmOpen(false);
    setIsDownloading(true);
    try {
      const expenseIds = filteredRows.map((r) => r.id).filter(Boolean);
      const response = await fetch("/api/expenses/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveToArchivos, expenseIds }),
      });

      const result = await response.json();

      if (result.error) {
        console.error("Error generating PDF:", result.error);
        alert("Error al generar el PDF: " + (result.error || "Error desconocido"));
        return;
      }

      const link = document.createElement("a");
      link.href = result.pdfUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (saveToArchivos) {
        alert("PDF generado y guardado en archivos.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Error al descargar el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <h2 className="sr-only">Egresos</h2>

      {/* Toolbar: Edit + Search/Filter bar + Añadir (single row, same as ingresos) */}
      <div className="flex items-center gap-2 mb-3">
        {allowManage && (
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
              filterMonth !== null || filterYear !== null || filterEstado !== "all"
                ? "bg-[#2d5016]/10 text-[#2d5016]"
                : "text-[#4d6547] hover:bg-[#eef1ea]"
            }`}
            title="Filtrar por mes, año y estado"
          >
            <Filter className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar concepto, proveedor o monto…"
            className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-11 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          />
          {/* Month/Year/Estado Filter Dropdown — overlaps content below */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Mes</label>
                <select
                  value={filterMonth ?? ""}
                  onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={filterEstado !== "all"}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors disabled:opacity-50"
                >
                  <option value="">Todos</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Año</label>
                <select
                  value={filterYear ?? ""}
                  onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={filterEstado !== "all"}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors disabled:opacity-50"
                >
                  <option value="">Todos</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">Estado</label>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value as EstadoFilter)}
                  className="bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1 text-xs text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors"
                >
                  <option value="all">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencido">Vencido</option>
                  <option value="Pagado">Pagado</option>
                </select>
              </div>
              {(filterMonth !== null || filterYear !== null || filterEstado !== "all") && (
                <button
                  onClick={() => { setFilterMonth(null); setFilterYear(null); setFilterEstado("all"); }}
                  className="px-2 py-0.5 rounded-[14px] text-[10px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>
        {allowCreate && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        )}
      </div>

      {/* Save bar when editing */}
      {isEditMode && editingFields.size > 0 && (
        <div className="flex items-center justify-between rounded-[14px] bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
          <span className="text-xs text-amber-800">
            {editingFields.size} cambio{editingFields.size !== 1 ? "s" : ""} pendiente{editingFields.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => handleSaveAll()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[14px] text-[11px] font-semibold text-[#faf6ec] bg-[#2d3d2a] hover:bg-[#22301f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Guardando…" : `Guardar cambios (${editingFields.size})`}
          </button>
        </div>
      )}

      {/* Scrollable Table (no pagination) */}
      <div className="overflow-auto h-[480px]">
        <PaginatedExpensesTable
          rows={sortedRows}
          itemsPerPage={itemsPerPage}
          currentPage={1}
          isEditMode={isEditMode}
          editingFields={editingFields}
          onEditValueChange={handleEditValueChange}
          onRemoveEdit={handleRemoveEdit}
          onSaveAll={handleSaveAll}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onComprobanteClick={(index: number) => {
            const expense = sortedRows[index];
            if (expense && expense.id) {
              setComprobanteExpense({ id: expense.id, concepto: expense.concepto });
              setIsComprobanteModalOpen(true);
            }
          }}
          onDeleteClick={handleDeleteClick}
          onDeleteComprobante={handleDeleteComprobante}
          onFacturaClick={(index: number) => {
            const expense = sortedRows[index];
            if (expense && expense.id) {
              setFacturaExpense({ id: expense.id, concepto: expense.concepto });
              setIsFacturaModalOpen(true);
            }
          }}
          onDeleteFactura={handleDeleteFactura}
          onEstadoChange={handleEstadoChange}
          canManage={allowManage}
        />
      </div>

      {allowManage && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleDownloadClick}
            disabled={isDownloading || filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? "Generando PDF…" : "Descargar"}
          </button>
        </div>
      )}

      <AddExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        canManagePresets={allowManage}
        onAdd={handleAddExpense}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteIndex(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={deleteIndex !== null ? rows[deleteIndex]?.concepto : undefined}
      />
      <ComprobanteUploadModal
        isOpen={isComprobanteModalOpen}
        onClose={() => {
          setIsComprobanteModalOpen(false);
          setComprobanteExpense(null);
        }}
        expenseId={comprobanteExpense?.id || ""}
        expenseConcepto={comprobanteExpense?.concepto || ""}
        onUploadSuccess={async () => {
          await refreshExpenses();
        }}
      />
      <ComprobanteUploadModal
        isOpen={isFacturaModalOpen}
        onClose={() => {
          setIsFacturaModalOpen(false);
          setFacturaExpense(null);
        }}
        expenseId={facturaExpense?.id || ""}
        expenseConcepto={facturaExpense?.concepto || ""}
        onUploadSuccess={async () => {
          await refreshExpenses();
        }}
        uploadUrl="/api/expenses/upload-factura"
        title="Subir factura"
      />
      {isDownloadConfirmOpen && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div
              className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
              style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
                <Download className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Egresos
                </div>
                <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                  Descargar PDF
                </h2>
              </div>
              <button
                onClick={() => { setIsDownloadConfirmOpen(false); setDownloadSaveToArchivos(false); }}
                disabled={isDownloading}
                className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              <label className="flex items-center gap-2.5 cursor-pointer rounded-[14px] bg-white border border-[#E9E2CE] px-3 py-2.5 hover:border-[#2d5016]/40 transition-colors">
                <input
                  type="checkbox"
                  checked={downloadSaveToArchivos}
                  onChange={(e) => setDownloadSaveToArchivos(e.target.checked)}
                  className="w-4 h-4 text-[#2d5016] border-[#E9E2CE] rounded focus:ring-[#2d5016]/40"
                  disabled={isDownloading}
                />
                <span className="text-xs text-[#1a2617]">
                  Guardar copia en Archivos → Egresos
                </span>
              </label>

              <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-dashed border-[#E9E2CE]">
                <button
                  onClick={() => { setIsDownloadConfirmOpen(false); setDownloadSaveToArchivos(false); }}
                  disabled={isDownloading}
                  className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDownloadConfirm(downloadSaveToArchivos)}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generando…
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete comprobante modal */}
      {confirmDeleteComprobante !== null && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-sm bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-6 py-5">
              <p className="text-sm text-[#1a2617]">
                ¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-dashed border-[#E9E2CE]">
              <button
                onClick={() => setConfirmDeleteComprobante(null)}
                disabled={deletingComprobante}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteComprobanteAction}
                disabled={deletingComprobante}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deletingComprobante ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete factura modal */}
      {confirmDeleteFactura !== null && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-sm bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-6 py-5">
              <p className="text-sm text-[#1a2617]">
                ¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-dashed border-[#E9E2CE]">
              <button
                onClick={() => setConfirmDeleteFactura(null)}
                disabled={deletingFactura}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteFacturaAction}
                disabled={deletingFactura}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deletingFactura ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
