"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { DEMO_NOTICE, DEMO_COMMUNITY_NAME } from "@/lib/demo";
import { DEMO_MUTATION_EVENT } from "@/lib/demo/install-demo-fetch";

export function DemoModeChrome() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showNotice = () => {
      setToast(DEMO_NOTICE);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setToast(null), 2800);
    };

    window.addEventListener(DEMO_MUTATION_EVENT, showNotice);
    return () => {
      window.removeEventListener(DEMO_MUTATION_EVENT, showNotice);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      <div className="fixed left-1/2 z-[60] -translate-x-1/2 pointer-events-none bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] sm:bottom-3">
        <div className="flex max-w-[calc(100vw_-_1.5rem)] items-center gap-2 whitespace-nowrap rounded-full border border-[#2d5016]/20 bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-[#2d5016] shadow-[0_4px_14px_rgba(0,0,0,0.12)] backdrop-blur">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#2d5016]" />
          Modo demostración
          <span className="hidden sm:inline"> · {DEMO_COMMUNITY_NAME} (datos de ejemplo)</span>
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 z-[70] -translate-x-1/2 px-4 bottom-[calc(8rem_+_env(safe-area-inset-bottom))] sm:bottom-14">
          <div className="flex max-w-[calc(100vw_-_2rem)] items-center gap-2 rounded-[14px] border border-[#E9E2CE] bg-[#1a2617] px-4 py-2.5 text-xs font-medium text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
            <Info className="h-4 w-4 shrink-0" strokeWidth={2} />
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
