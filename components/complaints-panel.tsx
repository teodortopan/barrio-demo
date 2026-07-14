"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, MessageSquare } from "lucide-react";

interface Complaint {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  description: string;
  category: string;
  complaint_type: string | null;
  admin_comment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    name: string;
    lot: string;
  } | null;
}

interface ComplaintsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ComplaintsPanel({
  isOpen,
  onClose,
  onUpdate,
}: ComplaintsPanelProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchComplaints();
    }
  }, [isOpen]);

  async function fetchComplaints() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/complaints");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching complaints:", result.error);
      } else {
        setComplaints(result.complaints || []);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAcknowledge = async (complaintId: string) => {
    try {
      const comment = comments[complaintId]?.trim() || null;
      const response = await fetch("/api/admin/acknowledge-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId, comment }),
      });

      const result = await response.json();
      if (result.error) {
        console.error("Error acknowledging complaint:", result.error);
        alert("Error al marcar como leído");
        return;
      }

      await fetchComplaints();
      onUpdate();
    } catch (error) {
      console.error("Error acknowledging complaint:", error);
      alert("Error al marcar como leído");
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      administrador: "Administrador",
      administracion: "Administración",
      coordinacion: "Coordinación",
      cuentas: "Cuentas",
      mantenimiento: "Mantenimiento",
      seguridad: "Seguridad",
      urbanismo: "Urbanismo",
    };
    return labels[category] || category;
  };

  const getTypeLabel = (type: string | null) => {
    if (type === "consulta") return "Consulta";
    if (type === "sugerencia") return "Sugerencia";
    if (type === "reclamo") return "Reclamo";
    if (type === "sugerencia_y_reclamo") return "Sugerencia y reclamo";
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === "read") {
      return (
        <span className="px-2 py-0.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wide bg-green-50 text-green-700 border border-green-200">
          Leído
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wide bg-red-50 text-red-700 border border-red-200">
        Pendiente
      </span>
    );
  };

  if (!isOpen || !mounted) return null;

  const node = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-4xl max-h-[85vh] bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE] flex-shrink-0"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <MessageSquare className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Comunidad
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              Consultas, sugerencias y reclamos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#4d6547]">Cargando…</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#4d6547]">No hay consultas, sugerencias ni reclamos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-[14px] bg-white border border-[#E9E2CE] p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#1a2617]">
                          {complaint.title}
                        </h3>
                        {getStatusBadge(complaint.status)}
                      </div>
                      <div className="space-y-1 text-xs text-[#4d6547]">
                        {getTypeLabel(complaint.complaint_type) && (
                          <div>
                            <span className="font-medium text-[#1a2617]">Tipo:</span>{" "}
                            {getTypeLabel(complaint.complaint_type)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-[#1a2617]">Dirigido a:</span>{" "}
                          {getCategoryLabel(complaint.category)}
                        </div>
                        {complaint.profiles && (
                          <div>
                            <span className="font-medium text-[#1a2617]">De:</span>{" "}
                            {complaint.profiles.name}
                            {complaint.profiles.lot && (
                              <span className="text-[#4d6547]"> (Lote: {complaint.profiles.lot})</span>
                            )}
                          </div>
                        )}
                        <div className="text-[#c9b893]">
                          {new Date(complaint.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                    {complaint.status !== "read" && (
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => handleAcknowledge(complaint.id)}
                          className="w-48 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marcar como leído
                        </button>
                        <textarea
                          value={comments[complaint.id] || ""}
                          onChange={(e) =>
                            setComments((prev) => ({ ...prev, [complaint.id]: e.target.value }))
                          }
                          placeholder="Comentario (opcional)…"
                          rows={2}
                          className="w-48 bg-white border border-[#E9E2CE] rounded-[14px] px-2 py-1.5 text-xs text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors resize-none"
                        />
                      </div>
                    )}
                  </div>
                  <div className="bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] px-3 py-2.5">
                    <p className="text-sm text-[#1a2617] whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>
                  {complaint.admin_comment && (
                    <div className="mt-2 rounded-[14px] bg-green-50 border border-green-200 px-3 py-2.5">
                      <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-green-700 mb-0.5">
                        Comentario de administración
                      </div>
                      <p className="text-sm text-[#1a2617] whitespace-pre-wrap">
                        {complaint.admin_comment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
