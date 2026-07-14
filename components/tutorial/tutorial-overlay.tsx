"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Hand, X } from "lucide-react";
import { useTutorial } from "@/lib/tutorial/tutorial-provider";

const PAD = 6; // spotlight breathing room around the target
const DIM = "rgba(26,38,23,0.6)";
const EASE = "all 260ms cubic-bezier(0.4,0,0.2,1)";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface View {
  rect: Rect | null; // null → centered card (fallback / loading)
  title: string;
  body: string;
  tap: boolean;
  tapHint?: string;
  stepIndex: number;
  total: number;
}

export function TutorialOverlay() {
  const { activeTour, currentStep, stepIndex, steps, next, prev, stop } =
    useTutorial();
  const pathname = usePathname() || "/";
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<View | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Build the displayed view. We keep the PREVIOUS view on screen until the next
  // target is located, so nothing flashes between steps; during a page change we
  // hold a plain dim (no stale spotlight).
  useEffect(() => {
    if (!currentStep) {
      setView(null);
      return;
    }

    const meta: Omit<View, "rect"> = {
      title: currentStep.title,
      body: currentStep.body,
      tap: !!currentStep.tap,
      tapHint: currentStep.tapHint,
      stepIndex,
      total: steps.length,
    };

    // No target → centered fallback card right away.
    if (!currentStep.target) {
      setView({ ...meta, rect: null });
      return;
    }

    // Still navigating to this step's page → steady dim, drop the stale spotlight.
    const navigating = !!currentStep.route && pathname !== currentStep.route;
    if (navigating) setView({ ...meta, rect: null });

    let cancelled = false;
    let last: Rect | null = null;
    let scrolled = false;
    const selector = `[data-tour-id="${currentStep.target}"]`;

    const same = (a: Rect | null, b: Rect | null) =>
      !!a &&
      !!b &&
      Math.abs(a.top - b.top) < 1 &&
      Math.abs(a.left - b.left) < 1 &&
      Math.abs(a.width - b.width) < 1 &&
      Math.abs(a.height - b.height) < 1;

    const getMeasuredElement = (target: HTMLElement) => {
      if (currentStep.target !== "caja-graficos") return target;
      const child = target.firstElementChild;
      if (!(child instanceof HTMLElement)) return target;
      const childRect = child.getBoundingClientRect();
      return childRect.width > 0 && childRect.height > 0 ? child : target;
    };

    const measure = (allowScroll: boolean): boolean => {
      if (currentStep.route && pathname !== currentStep.route) return false;
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
      const el = candidates.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (!el) return false;
      const measuredEl = getMeasuredElement(el);
      if (allowScroll && !scrolled) {
        measuredEl.scrollIntoView({ block: "center", inline: "nearest" });
        scrolled = true;
      }
      const r = measuredEl.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const rect: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
      if (!cancelled && !same(rect, last)) {
        last = rect;
        setView({ ...meta, rect });
      }
      return true;
    };

    let found = measure(true);
    const interval = setInterval(() => {
      if (cancelled) return;
      found = measure(!found) || found;
    }, 120);
    const stopPolling = setTimeout(() => {
      clearInterval(interval);
      if (!cancelled && !found) setView({ ...meta, rect: null }); // fallback: centered
    }, 6000);

    const onMove = () => measure(false);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(stopPolling);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [currentStep, stepIndex, steps, pathname]);

  // Tap-to-advance: clicking the real highlighted element advances the tour
  // (its own handler opens the panel / modal — nothing opens automatically).
  useEffect(() => {
    if (!currentStep?.tap || !currentStep.target) return;
    const selector = `[data-tour-id="${currentStep.target}"]`;
    let cancelled = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;
    const attach = () => {
      if (cancelled) return;
      const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (elements.length > 0) {
        const handler = () => next();
        elements.forEach((el) => el.addEventListener("click", handler));
        cleanup = () => elements.forEach((el) => el.removeEventListener("click", handler));
      } else {
        raf = requestAnimationFrame(attach);
      }
    };
    attach();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [currentStep, next]);

  // Keyboard: Esc closes, ← back. → advances except on tap steps (there the user
  // must tap the real element).
  useEffect(() => {
    if (!currentStep) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight" && !currentStep.tap) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentStep, next, prev, stop]);

  if (!mounted || !activeTour) return null;

  // Tour active but the first target isn't located yet → steady dim, no flash.
  if (!view) {
    return createPortal(
      <div className="fixed inset-0 z-[1188]" style={{ background: DIM }} />,
      document.body
    );
  }

  const { rect, tap } = view;
  const isLast = view.stepIndex === view.total - 1;
  const isFirst = view.stepIndex === 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(360, vw - 24);

  let cardStyle: React.CSSProperties;
  if (rect && isMobile) {
    cardStyle = { left: 12, right: 12, bottom: 84 };
  } else if (rect) {
    const gap = 14;
    const estH = 240;
    let top: number;
    if (rect.top + rect.height + gap + estH <= vh) top = rect.top + rect.height + gap;
    else if (rect.top - gap - estH >= 0) top = rect.top - gap - estH;
    else top = Math.max(12, vh - estH - 12);
    let left = rect.left + rect.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, vw - cardW - 12));
    cardStyle = { top, left, width: cardW };
  } else {
    cardStyle = { left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: cardW };
  }

  // Spotlight geometry. Cap the height to the visible viewport so a tall,
  // stretch-to-fill card (e.g. the Caja "Gráficos" card, which grows with flex-1
  // to match the column) doesn't bleed its highlight into the section below it.
  const t = rect ? Math.max(0, rect.top - PAD) : 0;
  const l = rect ? Math.max(0, rect.left - PAD) : 0;
  const w = rect ? rect.width + PAD * 2 : 0;
  const h = rect ? Math.min(rect.height + PAD * 2, Math.max(0, vh - t - 12)) : 0;
  const bottomY = t + h;
  const rightX = l + w;

  return createPortal(
    <div aria-live="polite">
      {rect ? (
        <>
          {/* Visual spotlight: one element, slides smoothly between steps. */}
          <div
            style={{
              position: "fixed",
              top: t,
              left: l,
              width: w,
              height: h,
              borderRadius: 14,
              boxShadow: `0 0 0 9999px ${DIM}`,
              border: "2px solid #2d5016",
              pointerEvents: "none",
              zIndex: 1190,
              transition: EASE,
            }}
          />
          {/* Click control. On tap steps we leave the hole open (transparent
              frame of 4 rects) so the user can tap the real element; otherwise a
              full transparent blocker keeps the tour the only interactive layer. */}
          {tap ? (
            <>
              <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: t, zIndex: 1188 }} />
              <div style={{ position: "fixed", top: bottomY, left: 0, width: "100%", height: Math.max(0, vh - bottomY), zIndex: 1188 }} />
              <div style={{ position: "fixed", top: t, left: 0, width: l, height: h, zIndex: 1188 }} />
              <div style={{ position: "fixed", top: t, left: rightX, width: Math.max(0, vw - rightX), height: h, zIndex: 1188 }} />
            </>
          ) : (
            <div className="fixed inset-0 z-[1188]" />
          )}
        </>
      ) : (
        <div className="fixed inset-0 z-[1188]" style={{ background: DIM }} />
      )}

      {/* Tip card */}
      <div
        className="fixed z-[1200] bg-[#faf6ec] border border-[#d9d2bf] rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-4"
        style={{ ...cardStyle, transition: EASE }}
        role="dialog"
        aria-modal="true"
        aria-label={view.title}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a2617]">
            {view.title}
          </h3>
          <button
            type="button"
            onClick={stop}
            aria-label="Cerrar tutorial"
            className="shrink-0 -mt-0.5 -mr-1 w-7 h-7 inline-flex items-center justify-center rounded-[10px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-[#3c3c3c]">{view.body}</p>

        {tap && view.tapHint && (
          <div className="mt-2.5 flex items-center gap-2 rounded-[10px] bg-[#2d5016]/8 border border-[#2d5016]/15 px-3 py-2 text-[12px] font-medium text-[#2d5016]">
            <Hand className="w-4 h-4 shrink-0" />
            <span>{view.tapHint}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-3">
          <span className="text-[11px] font-semibold text-[#4d6547] tabular-nums">
            {view.stepIndex + 1} / {view.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              aria-label="Anterior"
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-[10px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {tap ? null : (
              <button
                type="button"
                onClick={next}
                aria-label={isLast ? "Finalizar" : "Siguiente"}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] transition-colors text-xs font-semibold"
              >
                {isLast ? "Finalizar" : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
