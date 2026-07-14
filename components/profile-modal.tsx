"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Loader2, LogOut, Pencil, Plus, Save, X } from "lucide-react";
import { roleDisplayName } from "@/lib/auth/permissions";

const PROFILE_OPEN_EVENT = "sj:open-profile";
const PROFILE_CLOSE_EVENT = "sj:close-profile";
export const PROFILE_UPDATED_EVENT = "sj:profile-updated";

export function openProfileModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_OPEN_EVENT));
}

export function closeProfileModal() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROFILE_CLOSE_EVENT));
}

interface Conviviente {
  id?: string;
  name: string;
  relationship: string;
}

interface Vehiculo {
  id?: string;
  license_plate: string;
  model: string;
  owner_relationship: string | null;
  comprobante_url?: string | null;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  lot: string;
  role: string | null;
  phone: string;
  created_at: string | null;
}

const MESES_ABREV = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatDesde(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${MESES_ABREV[d.getMonth()]} ${d.getFullYear()}`;
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

const RELACIONES = [
  "Cónyuge",
  "Hijo/a",
  "Padre/Madre",
  "Hermano/a",
  "Otro familiar",
  "Otro",
];

const VEHICULO_RELACIONES = [
  "Titular",
  "Cónyuge",
  "Hijo/a",
  "Padre/Madre",
  "Otro",
];

export function ProfileModal() {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [vehUploadingIdx, setVehUploadingIdx] = useState<number | null>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [convivientes, setConvivientes] = useState<Conviviente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [editing, setEditing] = useState(false);

  // Editable copies (only used while editing).
  const [eName, setEName] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eConv, setEConv] = useState<Conviviente[]>([]);
  const [eVeh, setEVeh] = useState<Vehiculo[]>([]);

  const applyProfilePayload = useCallback((j: {
    profile: ProfileData;
    convivientes: Conviviente[];
    vehiculos: Vehiculo[];
  }): ProfileData => {
    setProfile(j.profile);
    setConvivientes(j.convivientes);
    setVehiculos(j.vehiculos);
    return j.profile;
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo cargar el perfil");
        return;
      }
      const j = await res.json();
      return applyProfilePayload({
        profile: j.profile as ProfileData,
        convivientes: j.convivientes as Conviviente[],
        vehiculos: j.vehiculos as Vehiculo[],
      });
    } catch (err) {
      console.error("load profile error:", err);
      setError("Error de red al cargar el perfil");
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyProfilePayload]);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setEditing(false);
      setError(null);
      setResetMsg(null);
      setVehUploadingIdx(null);
      loadProfile();
    };
    window.addEventListener(PROFILE_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(PROFILE_OPEN_EVENT, onOpen);
  }, [loadProfile]);

  useEffect(() => {
    const onClose = () => setOpen(false);
    window.addEventListener(PROFILE_CLOSE_EVENT, onClose);
    return () => window.removeEventListener(PROFILE_CLOSE_EVENT, onClose);
  }, []);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!saving) setOpen(false);
        return;
      }
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
  }, [open, saving]);

  const enterEdit = () => {
    if (!profile) return;
    setEName(profile.name);
    setEPhone(profile.phone);
    setEConv(convivientes.map((c) => ({ ...c })));
    setEVeh(vehiculos.map((v) => ({ ...v })));
    setEditing(true);
    setError(null);
    setResetMsg(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setVehUploadingIdx(null);
  };

  const save = async () => {
    if (!profile) return;
    if (!eName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eName.trim(),
          phone: ePhone.trim(),
          convivientes: eConv
            .map((c) => ({ name: c.name.trim(), relationship: c.relationship.trim() }))
            .filter((c) => c.name && c.relationship),
          vehiculos: eVeh
            .map((v) => ({
              license_plate: v.license_plate.trim().toUpperCase(),
              model: v.model.trim(),
              owner_relationship: (v.owner_relationship || "").trim() || null,
              comprobante_url: v.comprobante_url ?? null,
            }))
            .filter((v) => v.license_plate && v.model),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo guardar los cambios");
        return;
      }
      const j = await res.json().catch(() => null);
      const updatedProfile = j?.profile
        ? applyProfilePayload({
            profile: j.profile as ProfileData,
            convivientes: j.convivientes as Conviviente[],
            vehiculos: j.vehiculos as Vehiculo[],
          })
        : await loadProfile();
      if (updatedProfile) {
        window.dispatchEvent(
          new CustomEvent(PROFILE_UPDATED_EVENT, {
            detail: { name: updatedProfile.name, email: updatedProfile.email },
          })
        );
      }
      setEditing(false);
    } catch (err) {
      console.error("save profile error:", err);
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/demo/logout", { method: "POST" });
  };

  const handleResetPassword = async () => {
    if (!profile?.email || resetting) return;
    setResetting(true);
    setResetMsg(null);
    setError(null);
    try {
      await fetch("/api/demo/reset-password", { method: "POST" });
    } catch (err) {
      console.error("reset password error:", err);
      setError("Error de red. Intentá de nuevo.");
    } finally {
      setResetting(false);
    }
  };

  const uploadVehComprobante = async (idx: number, file: File) => {
    setVehUploadingIdx(idx);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/vehiculos/upload-comprobante", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.success) {
        setError(j.error || "No se pudo subir el comprobante");
        return;
      }
      setEVeh((prev) =>
        prev.map((row, i) => (i === idx ? { ...row, comprobante_url: j.path } : row))
      );
    } catch {
      setError("Error de red al subir el comprobante");
    } finally {
      setVehUploadingIdx(null);
    }
  };

  const comprobanteHref = (p?: string | null) =>
    p ? `/api/vehiculos/comprobante?path=${encodeURIComponent(p)}` : null;

  const titularLabel = useMemo(() => {
    if (!profile?.role) return "Vecino";
    return profile.role === "vecino" ? "Propietario titular" : "Personal del barrio";
  }, [profile?.role]);

  const initials = initialsFromName(profile?.name, profile?.email);
  const desde = formatDesde(profile?.created_at ?? null);
  const roleLabel = roleDisplayName(profile?.role);

  if (!open) return null;

  return (
    <div
      onClick={() => !saving && setOpen(false)}
      className="fixed inset-0 z-[1000] grid place-items-center p-3 sm:p-6"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] max-h-[88vh] overflow-y-auto bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 sm:px-8 py-6 border-b border-[#e7dfc9] rounded-t-[16px]"
          style={{
            background: "linear-gradient(180deg, #eef1ea, #faf6ec)",
          }}
        >
          <div className="w-[72px] h-[72px] shrink-0 rounded-full bg-[#2d3d2a] text-[#faf6ec] grid place-items-center text-[26px] font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              {titularLabel}
            </div>
            <div id="profile-modal-title" className="text-[22px] sm:text-[28px] leading-[1.1] text-[#1a2617] font-bold mt-1 break-words">
              {profile?.name || "—"}
            </div>
            {/* Lote / Desde / rol — wrap onto multiple lines on mobile so the
                role isn't lost to a `…` when the name is long. Stays inline on
                `sm:` and up. */}
            <div className="text-[13px] text-[#4d6547] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {profile?.lot && (
                <span className="whitespace-nowrap">Lote {profile.lot}</span>
              )}
              {profile?.lot && <span aria-hidden>·</span>}
              <span className="whitespace-nowrap">Desde {desde}</span>
              {profile?.role && (
                <>
                  <span aria-hidden>·</span>
                  <span className="whitespace-nowrap">{roleLabel}</span>
                </>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => !saving && setOpen(false)}
            disabled={saving}
            className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6">
          {loading ? (
            <div className="py-8 flex items-center justify-center text-[#4d6547] text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cargando perfil…
            </div>
          ) : profile ? (
            <>
              {/* Datos de contacto */}
              <div className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-3">
                Datos de contacto
              </div>
              <div data-tour-id="perfil-datos" className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-5">
                <Field
                  label="Nombre completo"
                  value={profile.name}
                  editing={editing}
                  inputValue={eName}
                  onChange={setEName}
                  full
                />
                <Field
                  label="Lote"
                  value={profile.lot || "—"}
                  editing={false}
                  inputValue=""
                  onChange={() => {}}
                />
                <Field
                  label="Celular"
                  value={profile.phone || "—"}
                  editing={editing}
                  inputValue={ePhone}
                  onChange={setEPhone}
                  placeholder="+54 9 221 …"
                  type="tel"
                  mono
                />
                <Field
                  label="Email"
                  value={profile.email}
                  editing={false}
                  inputValue=""
                  onChange={() => {}}
                  mono
                  full
                />
              </div>

              <Divider />

              {/* Convivientes */}
              <SectionHeader title="Convivientes del lote">
                {editing && (
                  <button
                    type="button"
                    onClick={() =>
                      setEConv((prev) => [...prev, { name: "", relationship: "" }])
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-[11px] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                )}
              </SectionHeader>
              {editing ? (
                <div className="mb-5 space-y-2">
                  {eConv.length === 0 && (
                    <p className="text-xs text-[#4d6547]">Aún no agregaste convivientes.</p>
                  )}
                  {eConv.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_7.5rem_auto] sm:grid-cols-[1fr_180px_auto] gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) =>
                          setEConv((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, name: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Nombre completo"
                        className="text-sm bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[#1a2617] focus:outline-none focus:border-[#2d3d2a]"
                      />
                      <select
                        value={c.relationship}
                        onChange={(e) =>
                          setEConv((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, relationship: e.target.value } : row
                            )
                          )
                        }
                        className="text-sm bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[#1a2617] focus:outline-none focus:border-[#2d3d2a]"
                      >
                        <option value="">Relación…</option>
                        {RELACIONES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setEConv((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="justify-self-end inline-flex items-center justify-center w-8 h-8 rounded-[14px] text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Quitar conviviente"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : convivientes.length > 0 ? (
                <ul className="mb-5 space-y-0">
                  {convivientes.map((c) => (
                    <li
                      key={c.id || `${c.name}-${c.relationship}`}
                      className="grid grid-cols-[1fr_auto] gap-3 py-2 border-b border-dashed border-[#e7dfc9] text-sm"
                    >
                      <span className="font-medium text-[#1a2617]">{c.name}</span>
                      <span className="text-[#4d6547]">{c.relationship}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#4d6547] mb-5">Sin convivientes registrados.</p>
              )}

              <Divider />

              {/* Vehiculos */}
              <div data-tour-id="perfil-vehiculos">
              <SectionHeader title="Vehículos registrados">
                {editing && (
                  <button
                    type="button"
                    onClick={() =>
                      setEVeh((prev) => [
                        ...prev,
                        {
                          license_plate: "",
                          model: "",
                          owner_relationship: "Titular",
                          comprobante_url: null,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-[11px] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar
                  </button>
                )}
              </SectionHeader>
              {editing ? (
                <div className="mb-5 space-y-2">
                  {eVeh.length === 0 && (
                    <p className="text-xs text-[#4d6547]">Aún no agregaste vehículos.</p>
                  )}
                  {eVeh.map((v, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-[120px_1fr_140px_auto_auto] gap-2 items-center"
                    >
                      <input
                        type="text"
                        value={v.license_plate}
                        onChange={(e) =>
                          setEVeh((prev) =>
                            prev.map((row, idx) =>
                              idx === i
                                ? { ...row, license_plate: e.target.value.toUpperCase() }
                                : row
                            )
                          )
                        }
                        placeholder="Patente"
                        className="text-sm font-mono bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[#1a2617] focus:outline-none focus:border-[#2d3d2a] uppercase"
                      />
                      <input
                        type="text"
                        value={v.model}
                        onChange={(e) =>
                          setEVeh((prev) =>
                            prev.map((row, idx) =>
                              idx === i ? { ...row, model: e.target.value } : row
                            )
                          )
                        }
                        placeholder="Marca y modelo"
                        className="text-sm bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[#1a2617] focus:outline-none focus:border-[#2d3d2a]"
                      />
                      <select
                        value={v.owner_relationship || ""}
                        onChange={(e) =>
                          setEVeh((prev) =>
                            prev.map((row, idx) =>
                              idx === i
                                ? { ...row, owner_relationship: e.target.value || null }
                                : row
                            )
                          )
                        }
                        className="text-sm bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[#1a2617] focus:outline-none focus:border-[#2d3d2a]"
                      >
                        <option value="">Relación…</option>
                        {VEHICULO_RELACIONES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <label className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-[11px] font-semibold cursor-pointer">
                          {vehUploadingIdx === i ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          {v.comprobante_url ? "Cambiar seguro" : "Seguro"}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            disabled={vehUploadingIdx !== null}
                            className="sr-only"
                            onChange={async (e) => {
                              const input = e.currentTarget;
                              const file = input.files?.[0];
                              if (file) await uploadVehComprobante(i, file);
                              input.value = "";
                            }}
                          />
                        </label>
                        {v.comprobante_url && (
                          <>
                            <a
                              href={comprobanteHref(v.comprobante_url)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-[#2d5016] hover:underline"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                setEVeh((prev) =>
                                  prev.map((row, idx) =>
                                    idx === i ? { ...row, comprobante_url: null } : row
                                  )
                                )
                              }
                              className="inline-flex items-center justify-center w-6 h-6 rounded-[12px] text-red-500 hover:bg-red-50 transition-colors"
                              aria-label="Quitar comprobante"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEVeh((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="justify-self-start sm:justify-self-end inline-flex items-center justify-center w-8 h-8 rounded-[14px] text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Quitar vehículo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : vehiculos.length > 0 ? (
                <ul className="mb-5 space-y-0">
                  {vehiculos.map((v) => (
                    <li
                      key={v.id || `${v.license_plate}-${v.model}`}
                      className="grid grid-cols-[100px_1fr_auto_auto] gap-3 py-2 border-b border-dashed border-[#e7dfc9] text-sm items-center"
                    >
                      <span className="font-mono text-[12px] bg-[#e0e6dc] px-2 py-0.5 rounded-[4px] text-center text-[#22301f]">
                        {v.license_plate}
                      </span>
                      <span className="text-[#1a2617]">{v.model}</span>
                      {v.owner_relationship ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#ede4d2] border border-[#e0d4bb] text-[#4d6547] text-[11px] font-medium">
                          {v.owner_relationship}
                        </span>
                      ) : (
                        <span />
                      )}
                      {v.comprobante_url ? (
                        <a
                          href={comprobanteHref(v.comprobante_url)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="justify-self-end text-[11px] font-semibold text-[#2d5016] hover:underline"
                        >
                          Ver seguro
                        </a>
                      ) : (
                        <span />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#4d6547] mb-5">Sin vehículos registrados.</p>
              )}
              </div>

              {resetMsg && (
                <div className="mb-3 px-3 py-2 rounded-[14px] bg-green-50 border border-green-200 text-green-700 text-xs">
                  {resetMsg}
                </div>
              )}

              {error && (
                <div className="mb-3 px-3 py-2 rounded-[14px] bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <Divider />

              {/* Footer actions */}
              <div data-tour-id="perfil-acciones" className="flex flex-wrap gap-2 justify-end pt-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Guardar cambios
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-xs font-semibold disabled:opacity-50"
                    >
                      {resetting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      Restablecer contraseña
                    </button>
                    <button
                      type="button"
                      onClick={enterEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-xs font-semibold"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar datos
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-red-600">
              {error || "No se pudo cargar el perfil"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <hr className="my-5 border-0 h-px bg-[#e7dfc9]" />;
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
        {title}
      </span>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  inputValue,
  onChange,
  placeholder,
  type = "text",
  mono = false,
  full = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  inputValue: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[11px] text-[#4d6547] mb-1">{label}</div>
      {editing ? (
        <input
          type={type}
          value={inputValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[13px] text-[#1a2617] focus:outline-none focus:border-[#2d3d2a] ${
            mono ? "font-mono" : ""
          }`}
        />
      ) : (
        <div className={`text-[13px] text-[#1a2617] ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}
