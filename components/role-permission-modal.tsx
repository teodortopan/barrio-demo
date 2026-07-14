"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, ShieldCheck, X } from "lucide-react";
import { permissionCatalog } from "@/lib/auth/permission-registry";

type PermissionCatalogItem = (typeof permissionCatalog)[number];

interface RolePermissionModalProps {
  slug: string;
  isNew?: boolean;
  onClose: () => void;
  onSaved?: (role: { slug: string; label: string; isNew: boolean }) => void | Promise<void>;
}

const allPermissionKeys = permissionCatalog.map((permission) => permission.key);

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

function formatRoleLabel(value: string): string {
  const label = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!label) return "";
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}

export function RolePermissionModal({
  slug,
  isNew = false,
  onClose,
  onSaved,
}: RolePermissionModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const normalizedSlug = normalizeSlug(slug);
  const isAdministrador = normalizedSlug === "administrador";

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(isAdministrador ? allPermissionKeys : [])
  );
  const [initialKeys, setInitialKeys] = useState<Set<string>>(
    () => new Set(isAdministrador ? allPermissionKeys : [])
  );
  const [loading, setLoading] = useState(!isNew && !isAdministrador);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedPermissions = useMemo(() => {
    return permissionCatalog.reduce<Record<string, PermissionCatalogItem[]>>(
      (acc, permission) => {
        if (!acc[permission.category]) acc[permission.category] = [];
        acc[permission.category].push(permission);
        return acc;
      },
      {}
    );
  }, []);

  const changed = useMemo(() => {
    if (isAdministrador) return false;
    if (isNew) return true;
    if (selectedKeys.size !== initialKeys.size) return true;
    for (const key of selectedKeys) {
      if (!initialKeys.has(key)) return true;
    }
    return false;
  }, [initialKeys, isAdministrador, isNew, selectedKeys]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, saving]);

  useEffect(() => {
    if (isAdministrador) {
      const all = new Set(allPermissionKeys);
      setSelectedKeys(all);
      setInitialKeys(all);
      setLoading(false);
      return;
    }

    if (isNew) {
      setSelectedKeys(new Set());
      setInitialKeys(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/roles/${encodeURIComponent(normalizedSlug)}/permissions`, {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudieron cargar los permisos.");
        return Array.isArray(data.keys) ? data.keys.filter((key: unknown) => typeof key === "string") : [];
      })
      .then((keys: string[]) => {
        if (cancelled) return;
        const next = new Set(keys);
        setSelectedKeys(next);
        setInitialKeys(next);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "No se pudieron cargar los permisos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdministrador, isNew, normalizedSlug]);

  const toggleKey = (key: string) => {
    if (isAdministrador || saving) return;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (isAdministrador || !normalizedSlug || !changed || saving || loading) return;
    setSaving(true);
    setError(null);
    try {
      let savedRole = { slug: normalizedSlug, label: normalizedSlug, isNew };

      if (isNew) {
        const createRes = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ slug: normalizedSlug, label: normalizedSlug }),
        });
        if (!createRes.ok && createRes.status !== 409) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(data.error || "No se pudo crear el rol.");
        }
        if (createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          if (data?.role?.slug && data?.role?.label) {
            savedRole = { slug: data.role.slug, label: data.role.label, isNew: true };
          }
        }
      }

      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(normalizedSlug)}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ keys: Array.from(selectedKeys) }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar los permisos.");

      await onSaved?.(savedRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los permisos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-[1100] grid place-items-center p-3 sm:p-6"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-permission-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[760px] max-h-[88vh] overflow-y-auto bg-[#faf6ec] rounded-[14px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <div
          className="flex items-center gap-3 px-6 sm:px-8 py-5 border-b border-[#e7dfc9] rounded-t-[14px]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
            <ShieldCheck className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              Roles
            </div>
            <h2
              id="role-permission-modal-title"
              className="text-base sm:text-lg font-bold text-[#1a2617] leading-tight mt-0.5 break-words"
            >
              Permisos de «{formatRoleLabel(normalizedSlug)}»
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-6">
          <p className="mb-4 rounded-[14px] bg-white border border-[#e7dfc9] px-3 py-2 text-xs text-[#4d6547]">
            Los cambios afectan a todos los usuarios que tengan este rol.
          </p>

          {isAdministrador && (
            <div className="mb-4 flex items-center gap-2 rounded-[14px] bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Rol protegido: tiene todos los permisos.</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 flex items-center justify-center text-[#4d6547] text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando permisos…
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <section key={category}>
                  <div className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
                    {category}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label
                        key={permission.key}
                        className="flex items-start gap-2 rounded-[14px] bg-white border border-[#e7dfc9] px-3 py-2 text-sm text-[#1a2617]"
                      >
                        <input
                          type="checkbox"
                          checked={isAdministrador || selectedKeys.has(permission.key)}
                          disabled={isAdministrador || saving}
                          onChange={() => toggleKey(permission.key)}
                          className="mt-0.5 h-4 w-4 accent-[#2d3d2a]"
                        />
                        <span className="leading-snug">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 sm:px-8 py-4 border-t border-[#e7dfc9]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
          >
            Cerrar
          </button>
          {!isAdministrador && (
            <button
              type="button"
              onClick={save}
              disabled={!normalizedSlug || !changed || saving || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
