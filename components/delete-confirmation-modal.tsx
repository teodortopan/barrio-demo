"use client";

import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  title?: string;
  message?: string;
  confirmText?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title,
  message,
  confirmText,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[14px] border border-gray-200 shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-[#1a1a1a]">
              {title || "Confirmar eliminación"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {message ? (
            <p className="text-sm text-[#1a1a1a] mb-4">
              {message}
            </p>
          ) : (
            <>
              <p className="text-sm text-[#1a1a1a] mb-4">
                ¿Estás seguro de que querés eliminar {itemName ? `"${itemName}"` : "este elemento"}?
              </p>
              <p className="text-xs text-gray-600">
                Esta acción no se puede deshacer.
              </p>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-[#1a1a1a] bg-gray-100 rounded-[14px] hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 text-sm font-medium text-white rounded-[14px] transition-colors ${
              confirmText === "Enviar"
                ? "bg-[#2d5016] hover:bg-[#3a6a1f]"
                : confirmText === "Confirmar"
                ? "bg-[#2d5016] hover:bg-[#3a6a1f]"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {confirmText || (title?.includes("descarga") ? "Confirmar" : "Eliminar")}
          </button>
        </div>
      </div>
    </div>
  );
}
