"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, XCircle, UserPlus } from "lucide-react";
import { ApprovalConfirmationModal } from "./approval-confirmation-modal";

interface PendingUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  lot: string;
  role: string;
}

interface PendingRequestsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PendingRequestsPanel({
  isOpen,
  onClose,
  onUpdate,
}: PendingRequestsPanelProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState<{
    user: PendingUser;
    action: "approve" | "reject";
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPendingUsers();
    }
  }, [isOpen]);

  async function fetchPendingUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/pending-users");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching pending users:", result.error);
      } else {
        setPendingUsers(result.users || []);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = (user: PendingUser) => {
    setActionUser({ user, action: "approve" });
  };

  const handleReject = (user: PendingUser) => {
    setActionUser({ user, action: "reject" });
  };

  const handleConfirmAction = async () => {
    if (!actionUser) return;

    try {
      if (actionUser.action === "approve") {
        const response = await fetch("/api/admin/approve-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: actionUser.user.id }),
        });

        const result = await response.json();
        if (result.error) {
          console.error("Error approving user:", result.error);
          alert("Error al aprobar el usuario");
          return;
        }
      } else {
        const response = await fetch("/api/admin/reject-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: actionUser.user.id,
            userId: actionUser.user.user_id,
          }),
        });

        const result = await response.json();
        if (result.error) {
          console.error("Error rejecting user:", result.error);
          alert("Error al rechazar el usuario");
          return;
        }
      }

      await fetchPendingUsers();
      onUpdate();
      setActionUser(null);
    } catch (error) {
      console.error("Error processing action:", error);
      alert("Error al procesar la acción");
    }
  };

  if (!isOpen || !mounted) return null;

  const node = (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[1000] grid place-items-center p-4"
        style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
      >
        <div className="w-full max-w-2xl max-h-[85vh] bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE] flex-shrink-0"
            style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
          >
            <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
              <UserPlus className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                Comunidad
              </div>
              <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 flex items-center gap-2">
                Solicitudes pendientes
                {pendingUsers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-[14px] text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 normal-case tracking-normal">
                    {pendingUsers.length}
                  </span>
                )}
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
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[#4d6547]">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-[14px] bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 transition-colors p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a2617] mb-1">
                          {user.name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-[#4d6547] mb-1">{user.email}</p>
                        {user.lot && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                              Lote
                            </span>
                            <span className="text-xs font-mono text-[#1a2617]">{user.lot}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionUser && (
        <ApprovalConfirmationModal
          isOpen={!!actionUser}
          onClose={() => setActionUser(null)}
          onConfirm={handleConfirmAction}
          user={actionUser.user}
          action={actionUser.action}
        />
      )}
    </>
  );

  return createPortal(node, document.body);
}
