"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { navLabelFromPath } from "@/components/sidebar";
import { NotificationsButton } from "@/components/notifications-button";
import { openProfileModal, PROFILE_UPDATED_EVENT } from "@/components/profile-modal";
import { openTutorialPicker } from "@/lib/tutorial/tutorial-events";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";

function initialsFromName(name?: string | null, email?: string | null): string {
  const src = (name || email || "").trim();
  if (!src) return "·";
  if (name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || "·";
  }
  return src[0]?.toUpperCase() || "·";
}

interface TopbarProps {
  userName?: string | null;
  userEmail?: string | null;
  adminVisibility?: AdminVisibility;
}

// Override sidebar item labels for paths whose item name doesn't read well as
// a global page title (e.g. /dashboard's nav item is "Mi gestión", but at the
// page level we want the broader "Mi panel" framing).
const TOPBAR_TITLE_OVERRIDES: Record<string, string> = {
  "/dashboard": "Mi panel",
  "/administracion": "Administración",
  "/comunidad": "Comunidad",
};

export function Topbar({ userName, userEmail, adminVisibility }: TopbarProps) {
  const pathname = usePathname() || "/";
  const title = TOPBAR_TITLE_OVERRIDES[pathname] ?? navLabelFromPath(pathname);
  const [displayName, setDisplayName] = useState(userName?.trim() || userEmail || "");

  useEffect(() => {
    setDisplayName(userName?.trim() || userEmail || "");
  }, [userName, userEmail]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string | null; email?: string | null }>).detail;
      setDisplayName(detail?.name?.trim() || detail?.email || userEmail || "");
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, [userEmail]);

  const initials = initialsFromName(displayName, userEmail);
  const canOpenProfile = !!userEmail;

  return (
    <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E9E2CE]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 h-12 flex items-center gap-3">
        {/* Page title */}
        <div className="min-w-0 flex items-baseline gap-2">
          <h1 className="text-sm sm:text-base font-bold uppercase tracking-wide text-[#1a1a1a] truncate">
            {title}
          </h1>
        </div>

        <div className="flex-1" />

        {/* Tutorial launcher — opens the role-aware picker */}
        <button
          type="button"
          onClick={() => openTutorialPicker(adminVisibility ?? null)}
          className="sj-icon-btn relative !w-11 !h-11 sm:!w-[34px] sm:!h-[34px] flex items-center justify-center select-none p-0"
          title="Tutorial"
          aria-label="Abrir el tutorial"
        >
          <GraduationCap className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <NotificationsButton variant="topbar" />

        {canOpenProfile && (
          <button
            type="button"
            data-tour-id="perfil-button"
            onClick={openProfileModal}
            className="inline-flex items-center justify-center gap-2 p-1 sm:pl-1 sm:pr-2 sm:py-1 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE] hover:bg-[#2d5016]/5 transition-colors"
            title="Ver perfil"
            aria-label={`Ver perfil de ${displayName}`}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-[14px] bg-[#2d5016] text-white text-[10px] sm:text-[11px] font-semibold">
              {initials}
            </span>
            <span className="hidden sm:inline max-w-[10rem] truncate text-xs font-medium text-[#1a1a1a]">
              {displayName}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
