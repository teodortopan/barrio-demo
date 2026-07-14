"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";
import { DEMO_COMMUNITY_SHORT } from "@/lib/demo";

type IconName =
  | "home"
  | "wallet"
  | "user"
  | "book"
  | "map"
  | "image"
  | "phone"
  | "shield"
  | "qr"
  | "checkin"
  | "users"
  | "camera"
  | "alert"
  | "doc"
  | "chart"
  | "mega"
  | "settings"
  | "bell";

function NavIcon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 20 20",
    className: "sj-nav-icon",
    xmlns: "http://www.w3.org/2000/svg",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10l7-6 7 6v8a2 2 0 0 1-2 2h-3v-6H8v6H5a2 2 0 0 1-2-2v-8z" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M3 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V6z" />
          <path d="M3 6V5a1 1 0 0 1 1-1h10" />
          <circle cx="14" cy="11.5" r="1" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="10" cy="7" r="3.5" />
          <path d="M3.5 17c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 4h12v13H5a1 1 0 0 1-1-1V4z" />
          <path d="M4 4a1 1 0 0 1 1-1h11v13" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M3 5l5-2 4 2 5-2v12l-5 2-4-2-5 2V5z" />
          <path d="M8 3v14M12 5v14" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="14" height="12" rx="1.5" />
          <circle cx="7" cy="8" r="1.5" />
          <path d="M3 14l4-4 3 3 3-3 4 4" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M5 3h3l1.5 4-2 1.5a9 9 0 0 0 4 4L13 10.5 17 12v3a2 2 0 0 1-2 2A12 12 0 0 1 3 5a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M10 2l7 3v5c0 4.5-3 7.5-7 8-4-.5-7-3.5-7-8V5l7-3z" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="6" height="6" />
          <rect x="11" y="3" width="6" height="6" />
          <rect x="3" y="11" width="6" height="6" />
          <path d="M11 11h2v2h-2zM15 11h2v6h-6v-2h4v-4z" />
        </svg>
      );
    case "checkin":
      return (
        <svg {...common}>
          <path d="M3 10h10M10 6l4 4-4 4M13 3h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="3" />
          <circle cx="14" cy="8" r="2.5" />
          <path d="M2 16c0-2.5 2-4 5-4s5 1.5 5 4M12 16c0-2 1.5-3 3.5-3s3.5 1 3.5 3" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="16" height="11" rx="1.5" />
          <path d="M7 6l1.5-2h3L13 6" />
          <circle cx="10" cy="11.5" r="3" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M10 3L2 17h16L10 3zM10 8v4M10 15v.5" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M5 2h7l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" />
          <path d="M12 2v4h4M7 10h6M7 13h6M7 16h4" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 17h14M5 14V9M9 14V5M13 14v-3M17 14V7" />
        </svg>
      );
    case "mega":
      return (
        <svg {...common}>
          <path d="M3 8v4l9 5V3L3 8z" />
          <path d="M14 7a3 3 0 0 1 0 6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.5 1.5M14.3 14.3l1.5 1.5M4.2 15.8l1.5-1.5M14.3 5.7l1.5-1.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...common}>
          <path d="M5 9a5 5 0 0 1 10 0v4l1.5 2H3.5L5 13V9z" />
          <path d="M8 17a2 2 0 0 0 4 0" />
        </svg>
      );
  }
}

type Panel = "residente" | "info" | "seguridad" | "admin";

type NavItem = { id: string; label: string; icon: IconName; href: string };
type NavSection = { title: string; items: NavItem[] };
type PanelDef = {
  key: Panel;
  pillLabel: string;
  title: string;
  sub: string;
  defaultHref: string;
  sections: NavSection[];
};

const PANELS: Record<Panel, PanelDef> = {
  residente: {
    key: "residente",
    pillLabel: "Mi Panel",
    title: "Mi Panel",
    sub: "Propietario",
    defaultHref: "/dashboard",
    sections: [
      {
        title: "Mi cuenta",
        items: [
          { id: "dashboard", label: "Mi gestión", icon: "home", href: "/dashboard" },
          { id: "dashboard-informacion", label: "Información", icon: "chart", href: "/dashboard/informacion" },
        ],
      },
    ],
  },
  info: {
    key: "info",
    pillLabel: "Barrio",
    title: "Barrio",
    sub: "Información pública",
    defaultHref: "/informacion",
    sections: [
      {
        title: "El barrio",
        items: [
          { id: "informacion", label: "Barrio", icon: "book", href: "/informacion" },
          { id: "comunidad", label: "Comunidad", icon: "users", href: "/comunidad" },
        ],
      },
    ],
  },
  seguridad: {
    key: "seguridad",
    pillLabel: "Seguridad",
    title: "Seguridad",
    sub: "Panel operativo",
    defaultHref: "/seguridad",
    sections: [
      {
        title: "Operación",
        items: [
          { id: "seguridad", label: "Panel", icon: "shield", href: "/seguridad" },
        ],
      },
    ],
  },
  admin: {
    key: "admin",
    pillLabel: "Consejo",
    title: "Consejo",
    sub: "Panel de control",
    defaultHref: "/admin/gestion",
    sections: [
      {
        title: "Control",
        items: [
          { id: "admin-gestion", label: "Gestión", icon: "users", href: "/admin/gestion" },
          { id: "admin-caja", label: "Caja", icon: "wallet", href: "/admin/ingresos" },
        ],
      },
    ],
  },
};

export function activePanelFromPath(pathname: string): Panel {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "residente";
  if (pathname === "/seguridad" || pathname.startsWith("/seguridad/")) return "seguridad";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  return "info";
}

type PanelIconName = Extract<IconName, "home" | "book" | "shield" | "chart">;
const PANEL_RAIL_ICON: Record<Panel, PanelIconName> = {
  residente: "home",
  info: "book",
  seguridad: "shield",
  admin: "chart",
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

export function Sidebar({
  adminVisibility,
}: {
  adminVisibility?: AdminVisibility;
  initialUserEmail?: string | null;
  initialUserName?: string | null;
}) {
  const pathname = usePathname() || "/";
  const router = useRouter();
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

  // Eagerly prefetch every accessible route once the sidebar mounts.
  // Each href visits each item; `router.prefetch` is not throttled like
  // viewport-based <Link prefetch>, so first navigation feels instant.
  useEffect(() => {
    for (const p of accessiblePanels) {
      const def = PANELS[p];
      router.prefetch(def.defaultHref);
      for (const sec of def.sections) {
        for (const it of sec.items) router.prefetch(it.href);
      }
    }
  }, [accessiblePanels, router]);

  const activePanel = activePanelFromPath(pathname);
  const config = PANELS[activePanel];
  const sections = useMemo(() => {
    if (activePanel !== "admin") return config.sections;
    return config.sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.href === "/admin/gestion") return visibility?.canSeeGestion ?? false;
        if (item.href === "/admin/ingresos") {
          return (visibility?.canSeeFinance || visibility?.canSeeEgresos) ?? false;
        }
        return true;
      }),
    })).filter((section) => section.items.length > 0);
  }, [activePanel, visibility, config.sections]);


  // Active item picker, used by the flyout nav list.
  const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
  const matchingHrefs = allHrefs.filter(
    (href) => pathname === href || pathname.startsWith(href + "/")
  );
  const activeHref = matchingHrefs.sort((a, b) => b.length - a.length)[0] ?? null;

  return (
    <aside className="sj-sidebar">
      {/* Rail — always visible (60px). Brand mark, panel icons, avatar + logout. */}
      <div className="sj-rail">
        <Link href="/dashboard" prefetch className="sj-rail-brand" title={DEMO_COMMUNITY_SHORT}>
          <div className="sj-brand-mark">B</div>
        </Link>

        <div className="sj-rail-panels">
          {accessiblePanels.map((p) => {
            const def = PANELS[p];
            const panelSelected = p === activePanel;
            const panelActive =
              panelSelected && (activeHref === null || activeHref === def.defaultHref);
            const panelSections = panelSelected
              ? p === "admin"
                ? sections
                : def.sections
              : [];
            const subItems = panelSections
              .flatMap((s) => s.items)
              .filter((item) => item.href !== def.defaultHref);
            return (
              <div key={p} className="sj-rail-panel-group">
                <Link
                  href={def.defaultHref}
                  prefetch
                  className={"sj-rail-icon" + (panelActive ? " active" : "")}
                  aria-current={panelActive ? "page" : undefined}
                  aria-label={def.pillLabel}
                  data-tooltip={def.pillLabel}
                  data-tour-id={tourIdForHref(def.defaultHref)}
                >
                  <NavIcon name={PANEL_RAIL_ICON[p]} />
                </Link>
                {subItems.length > 0 && (
                  <div className="sj-rail-subicons">
                    {subItems.map((item) => {
                      const subActive = item.href === activeHref;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          prefetch
                          className={"sj-rail-subicon" + (subActive ? " active" : "")}
                          aria-current={subActive ? "page" : undefined}
                          aria-label={item.label}
                          data-tooltip={item.label}
                          data-tour-id={tourIdForHref(item.href)}
                        >
                          <NavIcon name={item.icon} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </aside>
  );
}

export const PANEL_LABELS: Record<Panel, string> = {
  residente: "Mi Panel · Propietario",
  info: "Barrio · Información pública",
  seguridad: "Seguridad · Operativo",
  admin: "Consejo · Panel de control",
};

export function navLabelFromPath(pathname: string): string {
  const panel = activePanelFromPath(pathname);
  // Mirror the active-item picker in the sidebar: longest matching href wins.
  const items = PANELS[panel].sections.flatMap((s) => s.items);
  const matches = items.filter(
    (it) => pathname === it.href || pathname.startsWith(it.href + "/")
  );
  const winner = matches.sort((a, b) => b.href.length - a.href.length)[0];
  return winner ? winner.label : PANELS[panel].title;
}
