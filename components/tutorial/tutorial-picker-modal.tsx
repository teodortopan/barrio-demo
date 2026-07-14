"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTutorial } from "@/lib/tutorial/tutorial-provider";
import { TOUR_REGISTRY } from "@/lib/tutorial/tours";

export function TutorialPickerModal() {
  const { pickerOpen, closePicker, start, visibility } = useTutorial();
  const [mounted, setMounted] = useState(false);

  const tours = TOUR_REGISTRY.filter((t) => t.access?.(visibility) ?? true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [pickerOpen, closePicker]);

  if (!mounted || !pickerOpen) return null;

  return createPortal(
    <div
      onClick={closePicker}
      className="fixed inset-0 z-[1150] grid place-items-center p-3 sm:p-6"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial"
        className="w-full max-w-[520px] max-h-[88vh] overflow-y-auto bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#e7dfc9]">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Tutorial
            </div>
            <h2 className="text-[20px] leading-tight text-[#1a2617] font-bold mt-0.5">
              ¿Qué querés conocer?
            </h2>
          </div>
          <button
            type="button"
            onClick={closePicker}
            aria-label="Cerrar"
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid gap-2.5">
          {tours.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => start(t.id)}
                className="w-full flex items-center gap-3 p-3 rounded-[14px] border bg-white border-[#E9E2CE] hover:border-[#2d5016]/40 hover:bg-[#FBF8EF] transition-colors text-left"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
                  <Icon className="w-5 h-5 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1a2617]">{t.label}</p>
                  <p className="text-xs text-[#4d6547] mt-0.5">{t.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
