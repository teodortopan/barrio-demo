"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { PendingPaymentsModal } from "./pending-payments-modal";

export function PendingPaymentsButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/payments/pending");
        const data = await res.json();
        const list = data.paymentRequests ?? data.requests;
        if (!data.error && Array.isArray(list)) {
          setPendingCount(list.filter((r: { status: string }) => r.status === "pending").length);
        }
      } catch {
        /* ignore */
      }
    }

    fetchCount();
    // Pause polling while the tab is hidden.
    const interval = setInterval(() => {
      if (!document.hidden) fetchCount();
    }, 15000);
    const handleVisibility = () => {
      if (!document.hidden) fetchCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative inline-flex items-center gap-1.5 bg-white border border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] text-[#2d5016] rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        <Bell className="w-3.5 h-3.5" />
        Pagos pendientes
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>
      <PendingPaymentsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetch("/api/payments/pending")
            .then((r) => r.json())
            .then((data) => {
              const list = data.paymentRequests ?? data.requests;
              if (!data.error && Array.isArray(list)) {
                setPendingCount(list.filter((r: { status: string }) => r.status === "pending").length);
              }
            })
            .catch(() => {});
        }}
      />
    </>
  );
}
