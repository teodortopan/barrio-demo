"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, FileText, Plus, Users, X } from "lucide-react";
import { VisitForm } from "./visit-form";
import { ComplaintForm } from "./complaint-form";
import { MI_GESTION_REFRESH_EVENT } from "@/lib/mi-gestion-events";

const RELATIONSHIP_LABELS: Record<string, string> = {
  familiar: "Familiar",
  amigo: "Amigo",
  proveedor: "Proveedor/Servicio",
  trabajo: "Trabajo",
  otro: "Otro",
};

const CATEGORY_LABELS: Record<string, string> = {
  administrador: "Administrador",
  administracion: "Administración",
  coordinacion: "Coordinación",
  cuentas: "Cuentas",
  mantenimiento: "Mantenimiento",
  seguridad: "Seguridad",
  urbanismo: "Urbanismo",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":");
  return `${hours}:${minutes}hs`;
}

function getTypeLabel(type: string | null): string | null {
  if (type === "consulta") return "Consulta";
  if (type === "sugerencia") return "Sugerencia";
  if (type === "reclamo") return "Reclamo";
  if (type === "sugerencia_y_reclamo") return "Sugerencia y reclamo";
  return null;
}

function StatusPill({ status }: { status: string }) {
  if (status === "read") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[14px] bg-green-50 text-green-700 text-[10px] font-semibold whitespace-nowrap">
        <CheckCircle className="w-3 h-3" />
        Leído
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[14px] bg-orange-50 text-orange-600 text-[10px] font-semibold whitespace-nowrap">
      <Clock className="w-3 h-3" />
      Pendiente
    </span>
  );
}

function KindTag({ kind }: { kind: "visita" | "reclamo" }) {
  if (kind === "visita") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
        <Users className="w-3 h-3" strokeWidth={2} />
        Visita
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-semibold uppercase tracking-wide">
      <FileText className="w-3 h-3" strokeWidth={2} />
      Reclamo
    </span>
  );
}

function ActionCard({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#1a1a1a]">
            {title}
          </h3>
          <p className="text-[11px] text-[#3c3c3c] leading-snug mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCta}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-[#3a4f36] hover:bg-[#4d6547] text-white rounded-[14px] px-3 py-2 text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        {ctaLabel}
      </button>
    </div>
  );
}

interface UserVisit {
  id: string;
  visitor_name: string;
  visitor_dni: string;
  visit_date: string;
  visit_time: string;
  license_plate: string | null;
  relationship: string;
  notes: string | null;
  guard_comment: string | null;
  status: string;
  created_at: string;
}

interface UserComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  complaint_type: string | null;
  admin_comment: string | null;
  status: string;
  created_at: string;
}

const DISMISSED_KEY = "dismissed_complaints";

function getDismissedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function dismissComplaintLocal(id: string) {
  const dismissed = getDismissedIds();
  dismissed.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

interface EstadoCombinadoProps {
  initialVisits?: UserVisit[];
  initialComplaints?: UserComplaint[];
}

export function EstadoCombinado({
  initialVisits,
  initialComplaints,
}: EstadoCombinadoProps) {
  const [visits, setVisits] = useState<UserVisit[]>(initialVisits || []);
  const [complaints, setComplaints] = useState<UserComplaint[]>(initialComplaints || []);
  const [loadingVisits, setLoadingVisits] = useState(!initialVisits);
  const [loadingComplaints, setLoadingComplaints] = useState(!initialComplaints);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  const refreshVisits = async () => {
    try {
      const res = await fetch("/api/visits/user");
      const result = await res.json();
      if (!result.error) setVisits(result.visits || []);
    } catch (err) {
      console.error("Error fetching user visits:", err);
    } finally {
      setLoadingVisits(false);
    }
  };

  const refreshComplaints = async () => {
    try {
      const res = await fetch("/api/complaints/user");
      const result = await res.json();
      if (!result.error) setComplaints(result.complaints || []);
    } catch (err) {
      console.error("Error fetching user complaints:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (initialVisits) return;
    void refreshVisits();
  }, [initialVisits]);

  useEffect(() => {
    if (initialComplaints) return;
    void refreshComplaints();
  }, [initialComplaints]);

  useEffect(() => {
    const handleRefresh = () => {
      setLoadingVisits(true);
      setLoadingComplaints(true);
      void Promise.all([refreshVisits(), refreshComplaints()]);
    };

    window.addEventListener(MI_GESTION_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(MI_GESTION_REFRESH_EVENT, handleRefresh);
  }, []);

  const handleDismiss = (id: string) => {
    dismissComplaintLocal(id);
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const visibleComplaints = complaints.filter(
    (c) => !(c.status === "read" && dismissedIds.has(c.id))
  );

  const items = useMemo(() => {
    const v = visits.map((x) => ({ kind: "visita" as const, created_at: x.created_at, data: x }));
    const c = visibleComplaints.map((x) => ({ kind: "reclamo" as const, created_at: x.created_at, data: x }));
    return [...v, ...c].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [visits, visibleComplaints]);

  const loading = loadingVisits || loadingComplaints;
  const hasLoadedItems =
    (!loadingVisits && visits.length > 0) ||
    (!loadingComplaints && visibleComplaints.length > 0);

  return (
    <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2d5016]">
          Estado actual
        </span>
        {!loading && items.length > 0 && (
          <span className="text-[10px] text-[#3c3c3c]">
            {items.length} {items.length === 1 ? "ítem" : "ítems"}
          </span>
        )}
      </div>
      <div className="border-t border-dashed border-[#E9E2CE] px-3 py-3">
        <div className="space-y-2 overflow-y-auto pr-1 h-[150px]">
          {loading && !hasLoadedItems ? (
            <p className="text-xs text-gray-500 px-1">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">Sin actividad aún</p>
          ) : (
            items.map((item) =>
              item.kind === "visita" ? (
                <VisitaRow key={`v-${item.data.id}`} visit={item.data} />
              ) : (
                <ReclamoRow
                  key={`r-${item.data.id}`}
                  complaint={item.data}
                  onDismiss={handleDismiss}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

function VisitaRow({ visit }: { visit: UserVisit }) {
  return (
    <div className="rounded-[14px] bg-white border border-[#E9E2CE] p-2.5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <KindTag kind="visita" />
          </div>
          <p className="text-xs font-semibold text-[#1a1a1a] truncate">
            {visit.visitor_name}
          </p>
          <p className="text-[10px] text-[#3c3c3c] mt-0.5">
            {formatDate(visit.visit_date)} · {formatTime(visit.visit_time)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {RELATIONSHIP_LABELS[visit.relationship] || visit.relationship}
            {visit.license_plate && ` • Patente: ${visit.license_plate}`}
          </p>
        </div>
        <StatusPill status={visit.status} />
      </div>
      {visit.guard_comment && (
        <div className="mt-2 rounded-[14px] bg-[#2d5016]/5 border border-[#2d5016]/15 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-[#2d5016] mb-0.5">
            Comentario de seguridad
          </p>
          <p className="text-[11px] text-[#1a1a1a] leading-relaxed break-words whitespace-pre-wrap">
            {visit.guard_comment}
          </p>
        </div>
      )}
    </div>
  );
}

function ReclamoRow({
  complaint,
  onDismiss,
}: {
  complaint: UserComplaint;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="relative rounded-[14px] bg-white border border-[#E9E2CE] p-2.5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <KindTag kind="reclamo" />
          </div>
          <p className="text-xs font-semibold text-[#1a1a1a] truncate">
            {complaint.title}
          </p>
          {getTypeLabel(complaint.complaint_type) && (
            <p className="text-[10px] text-[#3c3c3c] mt-0.5">
              {getTypeLabel(complaint.complaint_type)}
            </p>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">
            Dirigido a: {CATEGORY_LABELS[complaint.category] || complaint.category}
          </p>
        </div>
        <StatusPill status={complaint.status} />
      </div>
      {complaint.admin_comment && (
        <div className="mt-2 rounded-[14px] bg-[#2d5016]/5 border border-[#2d5016]/15 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-[#2d5016] mb-0.5">
            Respuesta de administración
          </p>
          <p className="text-[11px] text-[#1a1a1a] leading-relaxed break-words whitespace-pre-wrap">
            {complaint.admin_comment}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-[10px] text-gray-500">
          {new Date(complaint.created_at).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
        {complaint.status === "read" && (
          <button
            type="button"
            onClick={() => onDismiss(complaint.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
            title="Quitar de la lista"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function VisitaActionCard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  return (
    <>
      <ActionCard
        icon={<Users className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />}
        title="Visita"
        description="Avisá a seguridad sobre tu próxima visita"
        ctaLabel="Autorizar visita"
        onCta={() => setIsFormOpen(true)}
      />
      <VisitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
}

export function ReclamoActionCard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  return (
    <>
      <ActionCard
        icon={<FileText className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />}
        title="Buzón administrativo"
        description="Enviá tus inquietudes a la administración"
        ctaLabel="Nueva gestión"
        onCta={() => setIsFormOpen(true)}
      />
      <ComplaintForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
}
