// Lightweight event bus to launch the tutorial picker from anywhere (e.g. the
// topbar graduation-cap button). Mirrors the `openProfileModal` pattern in
// components/profile-modal.tsx so we don't invent a new mechanism.
//
// The launcher passes the viewer's AdminVisibility (computed server-side, already
// in the layout) so the picker can show only the tours for pages they can reach.
// Type-only import — never pulls the server-only permissions resolver into the bundle.

import type { AdminVisibility } from "@/lib/auth/admin-visibility";

export const TUTORIAL_OPEN_EVENT = "sj:open-tutorial";

export function openTutorialPicker(visibility?: AdminVisibility | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TUTORIAL_OPEN_EVENT, { detail: { visibility: visibility ?? null } })
  );
}
