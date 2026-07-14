"use client";

// Mobile-only bottom navigation. Replaces the 60px left rail under the `sm`
// breakpoint so phones get the full screen width and a thumb-reachable, fully
// labeled nav bar at the bottom (closer to native app conventions, also
// friendlier for older users than icon-only sub-icon hover columns).
//
// Visibility mirrors the rail: residente + info are always shown, seguridad
// adds when the user has security or admin role, admin adds for administrator.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, BookOpen, Home, Megaphone, Shield, UserRound, Wallet } from "lucide-react";
import { activePanelFromPath } from "@/components/sidebar";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";

type Panel = "residente" | "info" | "seguridad" | "admin";
type NavRenderItem =
  | { kind: "panel"; panel: Panel }
  | {
      kind: "subpage";
      key: string;
      label: string;
      href: string;
      Icon: typeof Home;
    };

const PANEL_DEFS: Record<
  Panel,
  { label: string; href: string; Icon: typeof Home }
> = {
  residente: { label: "Mi panel", href: "/dashboard", Icon: Home },
  info: { label: "Barrio", href: "/informacion", Icon: BookOpen },
  seguridad: { label: "Seguridad", href: "/seguridad", Icon: Shield },
  admin: { label: "Consejo", href: "/admin/gestion", Icon: BarChart3 },
};

const SUBPAGES: Partial<
  Record<Panel, Array<{ label: string; href: string; Icon: typeof Home }>>
> = {
  residente: [
    { label: "Mi gestión", href: "/dashboard", Icon: Home },
    { label: "Información", href: "/dashboard/informacion", Icon: BarChart3 },
  ],
  info: [
    { label: "Barrio", href: "/informacion", Icon: BookOpen },
    { label: "Comunidad", href: "/comunidad", Icon: Megaphone },
  ],
  admin: [
    { label: "Gestión", href: "/admin/gestion", Icon: UserRound },
    { label: "Caja", href: "/admin/ingresos", Icon: Wallet },
  ],
};

function tourIdForHref(href: string): string | undefined {
  if (href === "/dashboard/informacion") return "nav-dashboard-informacion";
  if (href === "/informacion") return "nav-barrio";
  if (href === "/comunidad") return "nav-comunidad";
  if (href === "/seguridad") return "nav-seguridad";
  if (href === "/admin/gestion") return "nav-consejo";
  if (href === "/admin/ingresos") return "nav-caja";
  return undefined;
}

interface MobileBottomNavProps {
  adminVisibility?: AdminVisibility;
}

export function MobileBottomNav({ adminVisibility }: MobileBottomNavProps) {
  const pathname = usePathname() || "/";
  const [visibility, setVisibility] = useState<AdminVisibility | undefined>(adminVisibility);

  useEffect(() => {
    setVisibility(adminVisibility);
  }, [adminVisibility]);

  const accessiblePanels = useMemo<Panel[]>(() => {
    const panels: Panel[] = ["residente", "info"];
    const isAdmin = visibility?.isAdmin ?? false;
    const canSeeSecurity = isAdmin || (visibility?.canSeeSecurityArchive ?? false);
    if (canSeeSecurity) panels.push("seguridad");
    if (isAdmin) panels.push("admin");
    return panels;
  }, [visibility]);

  const activePanel = activePanelFromPath(pathname);
  const activeSubpages = useMemo(() => {
    const subpages = SUBPAGES[activePanel] ?? [];
    if (activePanel !== "admin") return subpages;
    return subpages.filter((item) => {
      if (item.href === "/admin/gestion") return visibility?.canSeeGestion ?? false;
      if (item.href === "/admin/ingresos") {
        return (visibility?.canSeeFinance || visibility?.canSeeEgresos) ?? false;
      }
      return true;
    });
  }, [activePanel, visibility]);

  const activeSubHref =
    activeSubpages
      .map((item) => item.href)
      .filter((href) => pathname === href || pathname.startsWith(href + "/"))
      .sort((a, b) => b.length - a.length)[0] ?? null;

  const renderItems = useMemo<NavRenderItem[]>(() => {
    const activeIndex = accessiblePanels.indexOf(activePanel);
    const subpageItems: NavRenderItem[] = activeSubpages
      .filter((item) => item.href !== PANEL_DEFS[activePanel].href)
      .map((item) => ({
        kind: "subpage",
        key: `${activePanel}-${item.href}`,
        label: item.label,
        href: item.href,
        Icon: item.Icon,
      }));

    const panelItems: NavRenderItem[] = accessiblePanels.map((panel) => ({
      kind: "panel",
      panel,
    }));

    if (subpageItems.length === 0 || activeIndex < 0) return panelItems;
    // Always insert sub-page chips immediately AFTER the active panel button
    // so the chips read as "options for the panel I'm in." Inserting before
    // (the previous behaviour for activeIndex > 0) put them visually attached
    // to the wrong neighbour.
    const insertAt = activeIndex + 1;
    return [
      ...panelItems.slice(0, insertAt),
      ...subpageItems,
      ...panelItems.slice(insertAt),
    ];
  }, [accessiblePanels, activePanel, activeSubpages]);

  return (
    <nav
      aria-label="Navegación principal"
      className="sm:hidden bg-[#293219] border-t border-[#1a2110] shadow-[0_-4px_12px_rgba(0,0,0,0.18)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch gap-1 overflow-x-auto px-1">
        {renderItems.map((item) => {
          if (item.kind === "subpage") {
            const Icon = item.Icon;
            const active = item.href === activeSubHref;
            return (
              <li key={item.key} className="shrink-0 flex items-center py-2">
                <Link
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  aria-label={item.label}
                  data-tour-id={tourIdForHref(item.href)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? "border-[#faf6ec] bg-[#faf6ec] text-[#2d3d2a]"
                      : "border-[#faf6ec]/20 bg-[#faf6ec]/8 text-[#c9b893] hover:bg-[#faf6ec]/14 hover:text-[#faf6ec]"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.7} />
                </Link>
              </li>
            );
          }

          const p = item.panel;
          const def = PANEL_DEFS[p];
          const Icon = def.Icon;
          const active =
            p === activePanel &&
            (activeSubHref === null || activeSubHref === def.href);
          return (
            <li key={p} className="min-w-[4.2rem] flex-1">
              <Link
                href={def.href}
                prefetch
                aria-current={active ? "page" : undefined}
                data-tour-id={tourIdForHref(def.href)}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 px-1 transition-colors ${
                  active
                    ? "text-[#faf6ec]"
                    : "text-[#9aae93] hover:text-[#faf6ec]"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-[12px] px-5 py-1.5 transition-colors ${
                    active ? "bg-[#faf6ec] text-[#2d3d2a]" : ""
                  }`}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={active ? 2 : 1.6}
                  />
                </span>
                <span className="text-[10px] font-semibold tracking-wide truncate max-w-full">
                  {def.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
