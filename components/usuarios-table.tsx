"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Filter, Inbox, Search, Users } from "lucide-react";
import { UsuarioProfileModal } from "@/components/usuario-profile-modal";

export interface UsuarioRow {
  id: string;
  user_id: string;
  name: string | null;
  lot: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
}

interface UsuariosTableProps {
  initialUsers: UsuarioRow[];
  canManageRoles: boolean;
}

const POLL_INTERVAL_MS = 10_000;

const ROLE_LABEL: Record<string, string> = {
  administrador: "Administrador",
  administracion: "Administración",
  coordinacion: "Coordinación",
  cuentas: "Cuentas",
  mantenimiento: "Mantenimiento",
  seguridad: "Seguridad",
  guardia: "Guardia",
  egresos: "Egresos",
  vecino: "Vecino",
  pendiente: "Pendiente",
};

const ROLE_FILTER_ORDER: string[] = [
  "administrador",
  "administracion",
  "coordinacion",
  "cuentas",
  "mantenimiento",
  "seguridad",
  "guardia",
  "egresos",
  "vecino",
  "pendiente",
];

const ROLE_PILL: Record<string, { bg: string; text: string; border: string }> = {
  administrador: { bg: "bg-[#2d5016]/10", text: "text-[#2d5016]", border: "border-[#2d5016]/30" },
  administracion: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  coordinacion: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  cuentas: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  mantenimiento: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  seguridad: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  guardia: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  egresos: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  vecino: { bg: "bg-[#FBF8EF]", text: "text-[#4d6547]", border: "border-[#E9E2CE]" },
  pendiente: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function rolePillClasses(role: string | null | undefined): string {
  const key = (role || "").trim().toLowerCase();
  const style = ROLE_PILL[key] || (key.includes("egreso") ? ROLE_PILL.egresos : ROLE_PILL.vecino);
  return `${style.bg} ${style.text} ${style.border}`;
}

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

// Compare two lote strings. Try numeric (most lotes look like "171" / "172"),
// fall back to a locale-aware string compare for any non-numeric oddballs
// (e.g. "171, 172" or "12B").
function compareLote(a: string | null, b: string | null): number {
  const av = (a || "").trim();
  const bv = (b || "").trim();
  if (!av && !bv) return 0;
  if (!av) return 1; // empty lotes go to the bottom
  if (!bv) return -1;
  const an = parseInt(av.match(/\d+/)?.[0] ?? "", 10);
  const bn = parseInt(bv.match(/\d+/)?.[0] ?? "", 10);
  if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn) {
    return an - bn;
  }
  return av.localeCompare(bv, "es", { numeric: true });
}

function normalizeSearchText(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

type SortField = "name" | "lote";
type SortDirection = "asc" | "desc";

export function UsuariosTable({ initialUsers, canManageRoles }: UsuariosTableProps) {
  const [users, setUsers] = useState<UsuarioRow[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  // Default sort: alphabetical by name (matches the page-load expectation).
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [roleFilter, setRoleFilter] = useState<string>("todos"); // "todos" or a role key
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch("/api/admin/profiles");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.profiles)) {
          setUsers(data.profiles);
        }
      } catch {
        /* keep stale data */
      }
    };
    refresh();
    // Pause polling while the tab is hidden.
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Close the filter popover on outside click.
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredUsers = useMemo(() => {
    const q = normalizeSearchText(searchQuery.trim());
    let result = users;
    if (q) {
      result = result.filter((u) => {
        const fields = [u.name, u.email, u.phone, u.lot, u.role].map(normalizeSearchText);
        return fields.some((f) => f.includes(q));
      });
    }
    if (roleFilter !== "todos") {
      result = result.filter(
        (u) => (u.role || "").trim().toLowerCase() === roleFilter
      );
    }
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortField === "lote") {
      result = [...result].sort((a, b) => compareLote(a.lot, b.lot) * dir);
    } else {
      // sortField === "name" (default)
      result = [...result].sort((a, b) => {
        const an = (a.name || a.email || "").trim();
        const bn = (b.name || b.email || "").trim();
        if (!an && !bn) return 0;
        if (!an) return 1; // unnamed users sort to the bottom
        if (!bn) return -1;
        return an.localeCompare(bn, "es", { sensitivity: "base" }) * dir;
      });
    }
    return result;
  }, [users, searchQuery, roleFilter, sortField, sortDirection]);

  const pendingCount = useMemo(
    () =>
      users.filter((u) => (u.role || "").trim().toLowerCase() === "pendiente").length,
    [users]
  );

  const refreshAfterChange = async () => {
    try {
      const res = await fetch("/api/admin/profiles");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data?.profiles)) {
        setUsers(data.profiles);
      }
    } catch {
      /* ignore */
    }
  };

  const filterActive = roleFilter !== "todos";
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <span className="inline-flex flex-col -space-y-0.5 ml-1">
          <ChevronUp className="w-3 h-3 text-gray-400" />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </span>
      );
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-[#2d5016] ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-[#2d5016] ml-1" />
    );
  };

  return (
    <div data-tour-id="gestion-usuarios" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
            <Users className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase truncate">
            Usuarios
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE] text-[#4d6547] text-[10px] font-bold uppercase tracking-wide">
            {users.length}
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wide">
              {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="relative mb-3" ref={filterRef}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4d6547]" />
        <input
          type="search"
          name="usuarios-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, lote, email, teléfono o rol…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          className="w-full bg-[#FBF8EF] border border-[#E9E2CE] rounded-[14px] pl-9 pr-11 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
        />
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-[14px] transition-colors z-10 ${
            filterActive
              ? "bg-[#2d5016]/10 text-[#2d5016]"
              : "text-[#4d6547] hover:bg-[#eef1ea]"
          }`}
          title="Filtrar por rol"
          aria-label="Filtrar por rol"
        >
          <Filter className="w-4 h-4" />
        </button>
        {filterOpen && (
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-3 min-w-[220px]">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
              Filtrar por rol
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setRoleFilter("todos");
                  setFilterOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-[14px] text-xs transition-colors ${
                  roleFilter === "todos"
                    ? "bg-[#2d5016] text-[#faf6ec]"
                    : "text-[#1a2617] hover:bg-[#FBF8EF]"
                }`}
              >
                Todos
              </button>
              {ROLE_FILTER_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRoleFilter(key);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-[14px] text-xs transition-colors ${
                    roleFilter === key
                      ? "bg-[#2d5016] text-[#faf6ec]"
                      : "text-[#1a2617] hover:bg-[#FBF8EF]"
                  }`}
                >
                  <span>{ROLE_LABEL[key]}</span>
                  <span
                    className={`text-[10px] tabular-nums ${
                      roleFilter === key ? "text-[#faf6ec]/80" : "text-[#4d6547]"
                    }`}
                  >
                    {users.filter((u) => (u.role || "").trim().toLowerCase() === key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div className="h-[420px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#e7ebe1] border-b border-[#E9E2CE]">
                <th
                  onClick={() => handleSort("name")}
                  className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] cursor-pointer select-none hover:bg-[#2d5016]/10 transition-colors"
                >
                  <span className="inline-flex items-center">
                    Usuario
                    <SortIcon field="name" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort("lote")}
                  className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] whitespace-nowrap hidden sm:table-cell cursor-pointer select-none hover:bg-[#2d5016]/10 transition-colors"
                >
                  <span className="inline-flex items-center">
                    Lote
                    <SortIcon field="lote" />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] hidden md:table-cell">
                  Email
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#2d5016] hidden lg:table-cell">
                  Teléfono
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#2d5016]">
                  Rol
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-[#4d6547]">
                      <div className="w-11 h-11 rounded-[14px] bg-white border border-[#E9E2CE] grid place-items-center">
                        <Inbox className="w-5 h-5 text-[#4d6547]" strokeWidth={1.6} />
                      </div>
                      <p className="text-xs">
                        {searchQuery || filterActive
                          ? "No se encontraron usuarios."
                          : "Aún no hay usuarios registrados."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleKey = (u.role || "").trim().toLowerCase() || "vecino";
                  const isPending = roleKey === "pendiente";
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedProfileId(u.id)}
                      className="border-b border-dashed border-[#E9E2CE] hover:bg-[#2d5016]/[0.04] cursor-pointer transition-colors last:border-b-0"
                    >
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`shrink-0 w-8 h-8 rounded-full grid place-items-center text-[11px] font-semibold uppercase border ${
                              isPending
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-[#3a4f36] text-[#faf6ec] border-[#4d6547]"
                            }`}
                          >
                            {initialsFromName(u.name, u.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1a2617] truncate">
                              {u.name || "Sin nombre"}
                            </div>
                            <div className="text-[10px] text-[#4d6547] truncate sm:hidden">
                              {u.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-xs font-mono text-[#1a2617] whitespace-nowrap hidden sm:table-cell">
                        {u.lot || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-xs text-[#4d6547] truncate hidden md:table-cell max-w-[260px]">
                        {u.email || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-xs text-[#4d6547] whitespace-nowrap hidden lg:table-cell">
                        {u.phone || "—"}
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${rolePillClasses(
                            u.role
                          )}`}
                        >
                          {ROLE_LABEL[roleKey] || u.role || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UsuarioProfileModal
        profileId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        onChanged={refreshAfterChange}
        canManageRoles={canManageRoles}
      />
    </div>
  );
}
