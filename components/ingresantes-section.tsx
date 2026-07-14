"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, Download, Pencil } from "lucide-react";
import { AddIngresanteForm } from "./add-ingresante-form";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { DownloadIngresantesPdfModal } from "./download-ingresantes-pdf-modal";

interface Ingresante {
  id: string;
  lote: string;
  nombre_apellido: string;
  tipo: "Propietario" | "Visita" | "Empleado";
  horario: string;
  documentacion: string | null;
}

interface IngresantesSectionProps {
  initialData?: Ingresante[];
  readOnly?: boolean;
}

export function IngresantesSection({ initialData, readOnly = false }: IngresantesSectionProps) {
  const [ingresantes, setIngresantes] = useState<Ingresante[]>(initialData || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(!initialData);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFields, setEditingFields] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) return;
    fetchIngresantes();
  }, [initialData]);

  async function fetchIngresantes() {
    try {
      const response = await fetch("/api/seguridad/ingresantes");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching ingresantes:", result.error);
      } else {
        setIngresantes(result.ingresantes || []);
      }
    } catch (error) {
      console.error("Error fetching ingresantes:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredIngresantes = ingresantes.filter((ing) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ing.lote.toLowerCase().includes(search) ||
      ing.nombre_apellido.toLowerCase().includes(search)
    );
  });

  const handleAddIngresante = async (ingresante: {
    lote: string;
    nombre_apellido: string;
    tipo: "Propietario" | "Visita" | "Empleado";
    horario: string;
    documentacion?: string;
  }) => {
    const response = await fetch("/api/seguridad/ingresantes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ingresante),
    });

    const result = await response.json();

    if (result.error) {
      console.error("Error creating ingresante:", result.error);
      throw new Error(result.error || "Error al crear el ingresante");
    }

    await fetchIngresantes();
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/seguridad/ingresantes/delete?id=${deleteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.error) {
        console.error("Error deleting ingresante:", result.error);
        alert("Error al eliminar el ingresante");
        return;
      }

      await fetchIngresantes();
    } catch (error) {
      console.error("Error deleting ingresante:", error);
      alert("Error al eliminar el ingresante");
    } finally {
      setDeleteId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDownloadClick = () => {
    if (ingresantes.length === 0) {
      alert("No hay datos para descargar");
      return;
    }
    setIsDownloadModalOpen(true);
  };

  // Edit mode functions
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

  const handleSaveAll = async () => {
    if (isSaving || editingFields.size === 0) return;

    setIsSaving(true);
    try {
      // Group edits by ingresante ID
      const byIngresante = new Map<string, Record<string, string>>();
      for (const [key, value] of editingFields.entries()) {
        const [id, field] = key.split("::");
        if (!id || !field) continue;
        if (!byIngresante.has(id)) byIngresante.set(id, { id });
        byIngresante.get(id)![field] = value;
      }

      const savePromises = Array.from(byIngresante.values()).map(async (body) => {
        const response = await fetch("/api/seguridad/ingresantes/update", {
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
      await fetchIngresantes();
    } catch (error) {
      console.error("Error updating ingresantes:", error);
      alert("Error al actualizar. Por favor intenta de nuevo.");
      await fetchIngresantes();
    } finally {
      setIsSaving(false);
    }
  };

  const getEditValue = (id: string, field: string, original: string) => {
    const key = `${id}::${field}`;
    return editingFields.has(key) ? editingFields.get(key)! : original;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando...</div>;
  }

  return (
    <>
      {/* Row 1: Edit/Add buttons + Search bar */}
      <div className="flex items-center gap-2 mb-4">
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ingresante…"
            className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-9 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
          />
        </div>
        {!readOnly && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-2 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        )}
      </div>

      {/* Save bar when there are pending edits */}
      {isEditMode && editingFields.size > 0 && (
        <div className="flex items-center justify-between rounded-[14px] bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
          <span className="text-xs text-amber-800">
            {editingFields.size} cambio{editingFields.size !== 1 ? "s" : ""} pendiente{editingFields.size !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditingFields(new Map())}
              className="px-2.5 py-1 text-[11px] font-medium text-[#4d6547] hover:bg-white/60 rounded-[14px] transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#faf6ec] bg-[#2d3d2a] hover:bg-[#22301f] rounded-[14px] transition-colors disabled:opacity-50"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Table inside cream card */}
      <div className="flex-1 min-h-0 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#2d5016]/10 border-b border-[#E9E2CE]">
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">LOTE</th>
                <th className="px-1.5 sm:px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">
                  <span className="hidden sm:inline">NOMBRE Y APELLIDO</span>
                  <span className="sm:hidden">NOMBRE</span>
                </th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">TIPO</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">HORARIO</th>
                <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">DOCUMENTACIÓN</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngresantes.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-xs text-[#4d6547]">
                    No hay ingresantes registrados
                  </td>
                </tr>
              )}
              {filteredIngresantes.map((ing) => {
                const horarioDate = new Date(ing.horario);
                const formattedHorario = horarioDate.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                const tipoColor =
                  ing.tipo === "Propietario"
                    ? "bg-[#2d5016]/10 text-[#2d5016]"
                    : ing.tipo === "Visita"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-[#ede4d2] text-[#8b6f47]";

                return (
                  <tr key={ing.id} className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.03] transition-colors">
                    <td className="px-3 py-2 text-xs text-center text-[#1a1a1a] font-mono font-semibold">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={getEditValue(ing.id, "lote", ing.lote)}
                          onChange={(e) => handleEditValueChange(`${ing.id}::lote`, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleRemoveEdit(`${ing.id}::lote`);
                            if (e.key === "Enter") handleSaveAll();
                          }}
                          className="w-full text-xs text-center font-mono bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-0.5 focus:outline-none focus:border-[#2d5016] transition-colors"
                        />
                      ) : (
                        ing.lote
                      )}
                    </td>
                    <td className="px-1.5 sm:px-3 py-2 text-xs text-center text-[#1a1a1a] font-medium">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={getEditValue(ing.id, "nombre_apellido", ing.nombre_apellido)}
                          onChange={(e) => handleEditValueChange(`${ing.id}::nombre_apellido`, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleRemoveEdit(`${ing.id}::nombre_apellido`);
                            if (e.key === "Enter") handleSaveAll();
                          }}
                          className="w-full text-xs text-center bg-white border border-[#E9E2CE] rounded-[14px] px-1.5 sm:px-2 py-0.5 focus:outline-none focus:border-[#2d5016] transition-colors"
                        />
                      ) : (
                        <span
                          className="block overflow-hidden break-words leading-tight [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
                          title={ing.nombre_apellido}
                        >
                          {ing.nombre_apellido}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center">
                      {isEditMode ? (
                        <select
                          value={getEditValue(ing.id, "tipo", ing.tipo)}
                          onChange={(e) => handleEditValueChange(`${ing.id}::tipo`, e.target.value)}
                          className="w-full text-xs text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-0.5 focus:outline-none focus:border-[#2d5016] transition-colors"
                        >
                          <option value="Propietario">Propietario</option>
                          <option value="Visita">Visita</option>
                          <option value="Empleado">Empleado</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[14px] text-[10px] font-semibold ${tipoColor}`}>
                          {ing.tipo}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#3c3c3c] font-mono whitespace-nowrap">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={getEditValue(ing.id, "horario", formattedHorario)}
                          onChange={(e) => handleEditValueChange(`${ing.id}::horario`, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleRemoveEdit(`${ing.id}::horario`);
                            if (e.key === "Enter") handleSaveAll();
                          }}
                          className="w-full text-xs text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-0.5 focus:outline-none focus:border-[#2d5016] transition-colors font-mono"
                        />
                      ) : (
                        formattedHorario
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-center text-[#3c3c3c]">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={getEditValue(ing.id, "documentacion", ing.documentacion || "")}
                            onChange={(e) => handleEditValueChange(`${ing.id}::documentacion`, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") handleRemoveEdit(`${ing.id}::documentacion`);
                              if (e.key === "Enter") handleSaveAll();
                            }}
                            className="w-full text-xs text-center bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-0.5 focus:outline-none focus:border-[#2d5016] transition-colors"
                          />
                        ) : (
                          <>
                            <span>{ing.documentacion || "-"}</span>
                            {!readOnly && (
                              <button
                                onClick={() => handleDeleteClick(ing.id)}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Eliminar"
                              >
                                ×
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Empty filler rows */}
              {Array.from({ length: Math.max(0, 26 - filteredIngresantes.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-dashed border-[#E9E2CE]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-3 py-2 text-xs text-center text-gray-400">-</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Button */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={handleDownloadClick}
          disabled={ingresantes.length === 0}
          className="inline-flex items-center gap-1.5 bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar
        </button>
      </div>

      <AddIngresanteForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onAdd={handleAddIngresante}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={deleteId ? ingresantes.find((i) => i.id === deleteId)?.nombre_apellido : undefined}
      />
      <DownloadIngresantesPdfModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </>
  );
}
