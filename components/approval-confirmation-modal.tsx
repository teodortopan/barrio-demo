"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface PendingUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  lot: string;
  role: string;
}

interface ApprovalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: PendingUser;
  action: "approve" | "reject";
}

export function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  action,
}: ApprovalConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isApprove = action === "approve";
  const actionText = isApprove ? "aprobar" : "rechazar";
  const confirmText = isApprove ? "Aprobar" : "Rechazar";

  const node = (
    <div
      className="fixed inset-0 z-[1100] grid place-items-center p-4"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-md bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div
            className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] ${
              isApprove ? "bg-[#2d5016]/10" : "bg-red-50"
            }`}
          >
            <AlertTriangle
              className={`w-5 h-5 ${isApprove ? "text-[#2d5016]" : "text-red-600"}`}
              strokeWidth={1.6}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Confirmación
            </div>
            <h2 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
              {isApprove ? "Aprobar solicitud" : "Rechazar solicitud"}
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
        <div className="px-6 py-5">
          <p className="text-sm text-[#1a2617] mb-3">
            ¿Confirmás {actionText} la solicitud de{" "}
            <strong>{user.name || "este usuario"}</strong>?
          </p>
          <div className="bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2.5 space-y-1.5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                Email
              </div>
              <div className="text-xs text-[#1a2617]">{user.email}</div>
            </div>
            {user.lot && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Lote
                </div>
                <div className="text-xs font-mono text-[#1a2617]">{user.lot}</div>
              </div>
            )}
          </div>
          {!isApprove && (
            <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Esta acción eliminará la cuenta del usuario permanentemente.</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2 border-t border-dashed border-[#E9E2CE]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors ${
              isApprove
                ? "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
