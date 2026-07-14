"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Settings,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { roleDisplayName } from "@/lib/auth/permissions";
import { RolePermissionModal } from "@/components/role-permission-modal";

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
  user_id: string;
  name: string;
  email: string;
  lot: string;
  role: string | null;
  phone: string;
  created_at: string | null;
}

interface AssignableRole {
  slug: string;
  label: string;
  is_assignable: boolean;
}

interface UsuarioProfileModalProps {
  profileId: string | null;
  onClose: () => void;
  onChanged: () => void;
  canManageRoles: boolean;
}

const MESES_ABREV = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const RELACIONES_CONVIVIENTE = [
  "Cónyuge",
  "Hijo/a",
  "Padre/Madre",
  "Hermano/a",
  "Otro familiar",
  "Otro",
];

const RELACIONES_VEHICULO = [
  "Titular",
  "Cónyuge",
  "Hijo/a",
  "Padre/Madre",
  "Otro",
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

function normalizeRoleSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatCustomRoleLabel(value: string): string {
  const label = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (!label) return "";
  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}

export function UsuarioProfileModal({
  profileId,
  onClose,
  onChanged,
  canManageRoles,
}: UsuarioProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const roleComboboxRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [vehUploadingIdx, setVehUploadingIdx] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [convivientes, setConvivientes] = useState<Conviviente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [canViewNotes, setCanViewNotes] = useState(false);
  const [canEditNotes, setCanEditNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleOptions, setRoleOptions] = useState<AssignableRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleQuery, setRoleQuery] = useState("");
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [configRole, setConfigRole] = useState<{ slug: string; isNew?: boolean } | null>(null);

  // Edit mode (master administrador only).
  const [editing, setEditing] = useState(false);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eLot, setELot] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eConv, setEConv] = useState<Conviviente[]>([]);
  const [eVeh, setEVeh] = useState<Vehiculo[]>([]);
  const [eNotes, setENotes] = useState<string>("");

  const open = profileId !== null;

  const loadProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/user-profile?profileId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "No se pudo cargar el perfil");
        setProfile(null);
        setConvivientes([]);
        setVehiculos([]);
        setNotes("");
        setCanViewNotes(false);
        setCanEditNotes(false);
        return;
      }
      const j = await res.json();
      setProfile(j.profile);
      setConvivientes(j.convivientes ?? []);
      setVehiculos(j.vehiculos ?? []);
      setNotes(typeof j.notes === "string" ? j.notes : "");
      setCanViewNotes(Boolean(j.can_view_notes));
      setCanEditNotes(Boolean(j.can_edit_notes));
    } catch (err) {
      console.error("load admin user-profile error:", err);
      setError("Error de red al cargar el perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    if (!canManageRoles) return;
    setRolesLoading(true);
    try {
      const res = await fetch("/api/admin/roles", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRoleOptions([]);
        return;
      }
      const roles: unknown[] = Array.isArray(data.roles) ? data.roles : [];
      const assignableRoles = roles.filter((role): role is AssignableRole => {
        if (!role || typeof role !== "object") return false;
        const candidate = role as Partial<AssignableRole>;
        return (
          typeof candidate.slug === "string" &&
          typeof candidate.label === "string" &&
          candidate.is_assignable === true
        );
      });
      setRoleOptions(assignableRoles.sort((a, b) => a.label.localeCompare(b.label, "es")));
    } catch {
      setRoleOptions([]);
    } finally {
      setRolesLoading(false);
    }
  }, [canManageRoles]);

  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      setConvivientes([]);
      setVehiculos([]);
      setNotes("");
      setCanViewNotes(false);
      setCanEditNotes(false);
      setError(null);
      setMessage(null);
      setShowDeleteConfirm(false);
      setEditing(false);
      setRoleOptions([]);
      setRoleQuery("");
      setShowRoleOptions(false);
      setConfigRole(null);
      setVehUploadingIdx(null);
      return;
    }
    setEditing(false);
    setVehUploadingIdx(null);
    loadProfile(profileId);
  }, [profileId, loadProfile]);

  useEffect(() => {
    if (!open || !profile || !canManageRoles || editing) return;
    loadRoles();
  }, [canManageRoles, editing, loadRoles, open, profile]);

  useEffect(() => {
    if (!open || !profile || !canManageRoles || editing || showRoleOptions) return;
    const role = (profile.role || "").trim().toLowerCase();
    if (!role || role === "pendiente") return;
    const roleOption = roleOptions.find((option) => option.slug === role);
    setRoleQuery(roleOption?.label || roleDisplayName(role) || role);
  }, [canManageRoles, editing, open, profile, roleOptions, showRoleOptions]);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, showDeleteConfirm, onClose]);

  useEffect(() => {
    if (!showRoleOptions) return;
    const handleClick = (e: MouseEvent) => {
      if (roleComboboxRef.current && !roleComboboxRef.current.contains(e.target as Node)) {
        setShowRoleOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showRoleOptions]);

  const titularLabel = useMemo(() => {
    const r = (profile?.role || "").trim().toLowerCase();
    if (!r) return "Vecino";
    if (r === "pendiente") return "Solicitud pendiente";
    return r === "vecino" ? "Propietario titular" : "Personal del barrio";
  }, [profile?.role]);

  const initials = initialsFromName(profile?.name, profile?.email);
  const desde = formatDesde(profile?.created_at ?? null);
  const roleLabel = roleDisplayName(profile?.role);
  const isPending = (profile?.role || "").trim().toLowerCase() === "pendiente";
  const currentRole = (profile?.role || "").trim().toLowerCase();
  const currentRoleOption = roleOptions.find((role) => role.slug === currentRole);
  const currentRoleLabel = currentRoleOption?.label || roleDisplayName(currentRole) || currentRole;
  const normalizedRoleQuery = normalizeRoleSearch(roleQuery);
  const normalizedCurrentRoleLabel = normalizeRoleSearch(currentRoleLabel);
  const queryIsCurrentRole =
    normalizedRoleQuery === currentRole || normalizedRoleQuery === normalizedCurrentRoleLabel;
  const availableRoleOptions = roleOptions.filter((role) => role.slug !== currentRole);
  const visibleRoleOptions = normalizedRoleQuery
    && !queryIsCurrentRole
    ? availableRoleOptions.filter(
        (role) =>
          normalizeRoleSearch(role.slug).includes(normalizedRoleQuery) ||
          normalizeRoleSearch(role.label).includes(normalizedRoleQuery)
      )
    : availableRoleOptions;
  const existingQueriedRole = roleOptions.some((role) => role.slug === normalizedRoleQuery);
  const canCreateQueriedRole =
    normalizedRoleQuery.length > 0 &&
    normalizedRoleQuery !== currentRole &&
    normalizedRoleQuery !== normalizedCurrentRoleLabel &&
    !existingQueriedRole &&
    /^[a-z0-9_-]+$/.test(normalizedRoleQuery);

  const handleClose = () => {
    if (busy) return;
    if (editing) {
      setEditing(false);
      return;
    }
    onClose();
  };

  const enterEdit = () => {
    if (!profile) return;
    setEName(profile.name || "");
    setEEmail(profile.email || "");
    setELot(profile.lot || "");
    setEPhone(profile.phone || "");
    setEConv(convivientes.map((c) => ({ ...c })));
    setEVeh(vehiculos.map((v) => ({ ...v })));
    setENotes(notes);
    setEditing(true);
    setError(null);
    setMessage(null);
    setVehUploadingIdx(null);
  };

  const cancelEdit = () => {
    if (busy) return;
    setEditing(false);
    setError(null);
    setVehUploadingIdx(null);
  };

  const uploadVehComprobante = async (idx: number, file: File) => {
    if (!profile) return;
    setVehUploadingIdx(idx);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("profileId", profile.id);
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

  const saveEdit = async () => {
    if (!profile || busy) return;
    if (!eName.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    if (eEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eEmail.trim())) {
      setError("Email inválido.");
      return;
    }
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const payload = {
        name: eName.trim(),
        email: eEmail.trim(),
        lot: eLot.trim(),
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
        ...(canEditNotes ? { notes: eNotes } : {}),
      };

      const res = await fetch(
        `/api/admin/user-profile?profileId=${encodeURIComponent(profile.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result?.error) {
        setError(result?.error || "No se pudo guardar el perfil.");
        return;
      }
      await loadProfile(profile.id);
      setEditing(false);
      setMessage("Perfil actualizado.");
      onChanged();
    } catch (err) {
      console.error("admin profile save error:", err);
      setError("Error de red al guardar el perfil.");
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (newRole: string, labelOverride?: string) => {
    if (!profile || !newRole || busy) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, role: newRole }),
      });
      const result = await res.json();
      if (!res.ok || result?.error) {
        setError(result?.error || "No se pudo actualizar el rol.");
        return;
      }
      const labelMap: Record<string, string> = roleOptions.reduce((acc, opt) => {
        acc[opt.slug] = opt.label;
        return acc;
      }, {} as Record<string, string>);
      setProfile((prev) => (prev ? { ...prev, role: newRole } : prev));
      setMessage(`Rol actualizado a ${labelOverride || labelMap[newRole] || newRole}.`);
      setRoleQuery("");
      setShowRoleOptions(false);
      onChanged();
    } catch {
      setError("No se pudo actualizar el rol.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!profile || busy) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      });
      const result = await res.json();
      if (!res.ok || result?.error) {
        setError(result?.error || "No se pudo aprobar el usuario.");
        return;
      }
      onChanged();
      onClose();
    } catch {
      setError("No se pudo aprobar el usuario.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!profile || busy) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, userId: profile.user_id }),
      });
      const result = await res.json();
      if (!res.ok || result?.error) {
        setError(result?.error || "No se pudo eliminar el usuario.");
        return;
      }
      onChanged();
      onClose();
    } catch {
      setError("No se pudo eliminar el usuario.");
    } finally {
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-[1000] grid place-items-center p-3 sm:p-6"
      style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="usuario-profile-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] max-h-[88vh] overflow-y-auto bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 sm:px-8 py-6 border-b border-[#e7dfc9] rounded-t-[16px]"
          style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
        >
          <div className="w-[72px] h-[72px] shrink-0 rounded-full bg-[#2d3d2a] text-[#faf6ec] grid place-items-center text-[26px] font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
              {titularLabel}
            </div>
            <div
              id="usuario-profile-modal-title"
              className="text-[22px] sm:text-[28px] leading-[1.1] text-[#1a2617] font-bold mt-1 break-words"
            >
              {profile?.name || "—"}
            </div>
            {/* Lote / desde / rol — drop the inline middle-dot on mobile and
                let each piece wrap to its own row when the header is narrow,
                so nothing ends in `…`. Pieces stay inline on `sm:` and up. */}
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
            onClick={handleClose}
            disabled={busy}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-5">
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
                  editing={editing}
                  inputValue={eLot}
                  onChange={setELot}
                  placeholder="171"
                  mono
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
                  editing={editing}
                  inputValue={eEmail}
                  onChange={setEEmail}
                  type="email"
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
                    <p className="text-xs text-[#4d6547]">Sin convivientes.</p>
                  )}
                  {eConv.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-center"
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
                        {RELACIONES_CONVIVIENTE.map((r) => (
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
                        className="justify-self-start sm:justify-self-end inline-flex items-center justify-center w-8 h-8 rounded-[14px] text-red-500 hover:bg-red-50 transition-colors"
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
                <p className="text-xs text-[#4d6547] mb-5">
                  Sin convivientes registrados.
                </p>
              )}

              <Divider />

              {/* Vehículos */}
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
                    <p className="text-xs text-[#4d6547]">Sin vehículos.</p>
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
                        {RELACIONES_VEHICULO.map((r) => (
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
                <p className="text-xs text-[#4d6547] mb-5">
                  Sin vehículos registrados.
                </p>
              )}

              {canViewNotes && (
                <>
                  {/* Admin-only notes about this vecino. The server withholds
                      this section for the subject's own profile, even if the
                      viewer is an administrador. */}
                  <Divider />
                  <SectionHeader title="Notas (admin)" />
                  {editing && canEditNotes ? (
                    <div className="mb-5">
                      <textarea
                        value={eNotes}
                        onChange={(e) => setENotes(e.target.value)}
                        placeholder="Notas internas visibles solo para el equipo administrativo…"
                        rows={4}
                        maxLength={5000}
                        className="w-full bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 py-1.5 text-[13px] text-[#1a2617] focus:outline-none focus:border-[#2d3d2a] resize-y"
                      />
                      <p className="text-[10px] text-[#4d6547] mt-1">
                        {eNotes.length}/5000
                      </p>
                    </div>
                  ) : notes ? (
                    <p className="mb-5 whitespace-pre-wrap text-[13px] text-[#1a2617] leading-relaxed bg-white border border-[#e7dfc9] rounded-[14px] px-3 py-2">
                      {notes}
                    </p>
                  ) : (
                    <p className="text-xs text-[#4d6547] mb-5 italic">
                      {canEditNotes
                        ? "Sin notas. Editá el perfil para agregar."
                        : "Sin notas registradas."}
                    </p>
                  )}
                </>
              )}

              {/* Admin role section — only the master administrador can ever
                  see this. Hidden in edit mode to keep the section list clean. */}
              {canManageRoles && !editing && (
                <>
                  <Divider />
                  <SectionHeader title="Rol y permisos" />
                  {isPending ? (
                    <div className="rounded-[14px] bg-amber-50 border border-amber-200 px-3 py-2.5 mb-3 text-xs text-amber-800">
                      Esta solicitud está esperando aprobación. Aprobar la convierte en un vecino con acceso al barrio.
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="text-[11px] text-[#4d6547] mb-1">Cambiar rol</div>
                      <div className="relative" ref={roleComboboxRef}>
                        <div className="relative">
                          <input
                            type="text"
                            value={roleQuery}
                            onChange={(e) => {
                              setRoleQuery(e.target.value);
                              setShowRoleOptions(true);
                            }}
                            onFocus={() => setShowRoleOptions(true)}
                            placeholder={rolesLoading ? "Cargando roles…" : "Seleccionar o crear rol…"}
                            disabled={busy}
                            className="w-full bg-white border border-[#d9d2bf] rounded-[14px] px-2.5 pr-[4.75rem] py-1.5 text-[13px] text-[#1a2617] placeholder-[#9a8f77] focus:outline-none focus:border-[#2d3d2a] disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentRole) return;
                              setConfigRole({ slug: currentRole });
                              setShowRoleOptions(false);
                            }}
                            disabled={busy || !currentRole}
                            className="absolute right-9 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-[14px] text-[#4d6547] hover:bg-[#FBF8EF] transition-colors disabled:opacity-50"
                            aria-label={`Configurar permisos de ${currentRoleLabel}`}
                            title="Configurar permisos del rol actual"
                          >
                            <Settings className="w-4 h-4 text-[#2d5016]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRoleOptions((v) => !v)}
                            disabled={busy}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center rounded-[14px] text-[#4d6547] hover:bg-[#FBF8EF] transition-colors disabled:opacity-50"
                            aria-label="Mostrar roles"
                            title="Mostrar roles"
                          >
                            {rolesLoading ? (
                              <Loader2 className="w-4 h-4 text-[#2d5016] animate-spin" />
                            ) : (
                              <ChevronDown
                                className={`w-4 h-4 text-[#2d5016] transition-transform ${showRoleOptions ? "rotate-180" : ""}`}
                              />
                            )}
                          </button>
                        </div>

                        {showRoleOptions && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[14px] shadow-lg z-50 max-h-64 overflow-y-auto">
                            {visibleRoleOptions.length > 0 ? (
                              <ul className="py-1">
                                {visibleRoleOptions.map((role) => (
                                  <li
                                    key={role.slug}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 group"
                                  >
                                    <button
                                      data-demo-mutation
                                      type="button"
                                      onClick={() => handleRoleChange(role.slug)}
                                      disabled={busy}
                                      className="min-w-0 flex-1 text-left disabled:opacity-50"
                                    >
                                      <span className="block text-sm text-[#1a2617] truncate">
                                        {role.label}
                                      </span>
                                      <span className="block text-[11px] text-[#4d6547] truncate">
                                        {role.slug}
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setConfigRole({ slug: role.slug });
                                        setShowRoleOptions(false);
                                      }}
                                      className="ml-2 w-8 h-8 inline-flex items-center justify-center rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
                                      aria-label={`Configurar permisos de ${role.label}`}
                                      title="Configurar permisos"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="px-3 py-2 text-sm text-gray-400">
                                {rolesLoading ? "Cargando roles…" : "Sin coincidencias"}
                              </p>
                            )}

                            {canCreateQueriedRole && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfigRole({ slug: normalizedRoleQuery, isNew: true });
                                  setShowRoleOptions(false);
                                }}
                                className="w-full flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2 text-left hover:bg-[#FBF8EF] transition-colors"
                              >
                                <span className="min-w-0 text-sm text-[#1a2617] truncate">
                                  Crear y configurar «{formatCustomRoleLabel(normalizedRoleQuery)}»
                                </span>
                                <Settings className="w-4 h-4 shrink-0 text-[#4d6547]" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#4d6547]">
                        Configurar un rol afecta a todos los usuarios que lo tengan.
                      </p>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <Divider />

              {/* Footer actions */}
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {busy ? (
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
                      onClick={onClose}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      Cerrar
                    </button>
                    {canManageRoles && (
                      <>
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={handleApprove}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec] text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Aprobar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={enterEdit}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-white border border-[#d9d2bf] text-[#2d3d2a] hover:bg-[#eef1ea] transition-colors text-xs font-semibold disabled:opacity-50"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar datos
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar usuario
                            </button>
                          </>
                        )}
                      </>
                    )}
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

      {/* Delete confirmation */}
      {showDeleteConfirm && profile && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setShowDeleteConfirm(false);
          }}
          className="fixed inset-0 z-[1100] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-sm bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
            <div
              className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE]"
              style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-red-50">
                <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Confirmación
                </div>
                <h3 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5">
                  {isPending ? "Rechazar solicitud" : "Eliminar usuario"}
                </h3>
              </div>
              <button
                onClick={() => !busy && setShowDeleteConfirm(false)}
                disabled={busy}
                className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#1a2617]">
                {isPending
                  ? "Vas a rechazar y eliminar la solicitud de "
                  : "Vas a eliminar permanentemente la cuenta de "}
                <strong>{profile.name || profile.email || "este usuario"}</strong>.
                Esta acción elimina su perfil y su acceso.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 pb-5 pt-2 border-t border-dashed border-[#E9E2CE]">
              <button
                type="button"
                onClick={() => !busy && setShowDeleteConfirm(false)}
                disabled={busy}
                className="px-3 py-1.5 rounded-[14px] text-[#4d6547] hover:bg-[#eef1ea] transition-colors text-xs font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Eliminando…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    {isPending ? "Rechazar" : "Eliminar"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {configRole && (
        <RolePermissionModal
          slug={configRole.slug}
          isNew={configRole.isNew}
          onClose={() => setConfigRole(null)}
          onSaved={async (role) => {
            await loadRoles();
            setRoleQuery("");
            if (role.isNew) {
              await handleRoleChange(role.slug, role.label);
            }
          }}
        />
      )}
    </div>
  );
}

function Divider() {
  return <hr className="my-5 border-0 h-px bg-[#e7dfc9]" />;
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
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
        <div className={`text-[13px] text-[#1a2617] ${mono ? "font-mono break-all" : ""}`}>
          {value || "—"}
        </div>
      )}
    </div>
  );
}
