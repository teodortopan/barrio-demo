"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Calendar, User, X } from "lucide-react";

interface PastComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  complaint_type: string | null;
  admin_comment: string | null;
  user_name: string;
  user_lot: string | null;
  created_at: string;
  updated_at: string;
}

export function ReclamosArchivoView() {
  const [complaints, setComplaints] = useState<PastComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PastComplaint | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function fetchComplaints() {
    try {
      const response = await fetch("/api/archivo/reclamos");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching past complaints:", result.error);
      } else {
        setComplaints(result.complaints || []);
      }
    } catch (error) {
      console.error("Error fetching past complaints:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/complaints/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: deleteTarget.id }),
      });
      const result = await response.json();
      if (result.error) {
        console.error("Error deleting complaint:", result.error);
        alert("Error al eliminar el registro");
      } else {
        setComplaints((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error("Error deleting complaint:", error);
      alert("Error al eliminar el registro");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No hay consultas ni reclamos archivados</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="p-4 bg-gray-50 rounded-[14px] border border-gray-200 relative"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-[#2d5016] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-[#1a1a1a]">
                    {complaint.title}
                  </h3>
                  {complaint.complaint_type && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                      {complaint.complaint_type === "consulta" ? "Consulta" : complaint.complaint_type === "sugerencia" ? "Sugerencia" : complaint.complaint_type === "reclamo" ? "Reclamo" : "Sugerencia y reclamo"}
                    </span>
                  )}
                  {complaint.category && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-medium">
                      {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                    Leído
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  {complaint.description}
                </p>
                {complaint.admin_comment && (
                  <div className="bg-green-50 rounded p-2.5 mb-3 border border-green-200">
                    <p className="text-xs font-medium text-green-700 mb-0.5">Respuesta de administración:</p>
                    <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{complaint.admin_comment}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{complaint.user_name}{complaint.user_lot ? ` (Lote ${complaint.user_lot})` : ""}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Creado: {new Date(complaint.created_at).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  {complaint.updated_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Leído: {new Date(complaint.updated_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDeleteTarget(complaint)}
              className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Eliminar registro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation popup */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">
              Eliminar registro
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              ¿Estás seguro de que querés eliminar este registro?
            </p>
            <p className="text-sm font-medium text-[#1a1a1a] mb-4">
              &ldquo;{deleteTarget.title}&rdquo;
            </p>
            <p className="text-xs text-red-500 mb-5">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-[14px] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-[14px] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
