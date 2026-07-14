"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildTour, type TourContext, type TourId, type TourStep } from "./tours";
import { TUTORIAL_OPEN_EVENT } from "./tutorial-events";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";
import { openProfileModal, closeProfileModal } from "@/components/profile-modal";
import {
  openNotificationsPanel,
  closeNotificationsPanel,
} from "@/components/notifications-button";

interface TutorialContextValue {
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  visibility: AdminVisibility | null;
  activeTour: TourId | null;
  steps: TourStep[];
  stepIndex: number;
  currentStep: TourStep | null;
  start: (id: TourId) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

const TutorialCtx = createContext<TutorialContextValue | null>(null);

export function useTutorial(): TutorialContextValue {
  const value = useContext(TutorialCtx);
  if (!value) throw new Error("useTutorial must be used within TutorialProvider");
  return value;
}

const STORAGE_KEY = "sj_tutorial_v1";

// Going FORWARD, the profile modal / notificaciones panel are opened by the user
// themselves (a tap step on the real bell/avatar), so we never auto-open then.
// Going BACKWARD (replaying a step), we re-open the surface so the step has
// something to show. We always close it when the tour leaves the surface.
function openContext(ctx: TourContext) {
  if (ctx === "profile") openProfileModal();
  else if (ctx === "notifications") openNotificationsPanel();
}

function closeContext(ctx: TourContext) {
  if (ctx === "profile") closeProfileModal();
  else if (ctx === "notifications") closeNotificationsPanel();
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [visibility, setVisibility] = useState<AdminVisibility | null>(null);
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const prevContextRef = useRef<TourContext | null>(null);
  const prevStepIndexRef = useRef<number>(-1);

  const steps = useMemo<TourStep[]>(
    () => (activeTour ? buildTour(activeTour, visibility) : []),
    [activeTour, visibility]
  );
  const currentStep = activeTour ? steps[stepIndex] ?? null : null;

  // Resume an in-progress tour after a reload / hard navigation. We persist the
  // role visibility too, so a resumed staff tour keeps the right (gated) steps.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        tour?: TourId;
        step?: number;
        visibility?: AdminVisibility | null;
      };
      if (parsed.tour) {
        const vis = parsed.visibility ?? null;
        const built = buildTour(parsed.tour, vis);
        if (built.length === 0) return;
        setVisibility(vis);
        setActiveTour(parsed.tour);
        setStepIndex(Math.min(Math.max(0, parsed.step ?? 0), built.length - 1));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist progress so a reload mid-tour resumes where it left off.
  useEffect(() => {
    try {
      if (activeTour) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ tour: activeTour, step: stepIndex, visibility })
        );
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [activeTour, stepIndex, visibility]);

  // Launch the picker from the topbar button (or anywhere). The event carries the
  // viewer's AdminVisibility so the picker + tours gate by what they can reach.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ visibility?: AdminVisibility | null }>).detail;
      setVisibility(detail?.visibility ?? null);
      setPickerOpen(true);
    };
    window.addEventListener(TUTORIAL_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(TUTORIAL_OPEN_EVENT, onOpen);
  }, []);

  // Drive cross-page navigation: when a step lives on another route, go there.
  useEffect(() => {
    if (!activeTour || !currentStep) return;
    if (currentStep.route && pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  }, [activeTour, currentStep, pathname, router]);

  // Manage the profile modal / notificaciones panel as the tour enters/leaves a
  // context. Close when leaving. Open ONLY when stepping backward (replay) — going
  // forward the user opened it themselves via the tap step, and re-opening would
  // re-trigger the modal's load spinner (a flash).
  useEffect(() => {
    const ctx = currentStep?.context ?? null;
    const backward = stepIndex < prevStepIndexRef.current;
    prevStepIndexRef.current = stepIndex;
    if (ctx === prevContextRef.current) return;
    if (prevContextRef.current) closeContext(prevContextRef.current);
    if (ctx && backward) openContext(ctx);
    prevContextRef.current = ctx;
  }, [currentStep, stepIndex]);

  const start = useCallback((id: TourId) => {
    prevStepIndexRef.current = -1;
    setActiveTour(id);
    setStepIndex(0);
    setPickerOpen(false);
  }, []);

  const stop = useCallback(() => {
    if (prevContextRef.current) {
      closeContext(prevContextRef.current);
      prevContextRef.current = null;
    }
    setActiveTour(null);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    if (!activeTour) return;
    const last = steps.length - 1;
    if (stepIndex >= last) stop();
    else setStepIndex(stepIndex + 1);
  }, [activeTour, steps.length, stepIndex, stop]);

  const prev = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  const value = useMemo<TutorialContextValue>(
    () => ({
      pickerOpen,
      openPicker,
      closePicker,
      visibility,
      activeTour,
      steps,
      stepIndex,
      currentStep,
      start,
      next,
      prev,
      stop,
    }),
    [
      pickerOpen,
      openPicker,
      closePicker,
      visibility,
      activeTour,
      steps,
      stepIndex,
      currentStep,
      start,
      next,
      prev,
      stop,
    ]
  );

  return <TutorialCtx.Provider value={value}>{children}</TutorialCtx.Provider>;
}
