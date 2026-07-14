import { Suspense } from "react";
import { ReminderBoard } from "@/components/reminder-board";
import { CalendarEventForm } from "@/components/calendar-event-form";
import { ReclamosFeed } from "@/components/reclamos-feed";
import { BibliotecaDigitalPanel } from "@/components/biblioteca-digital-panel";
import { UsuariosTable } from "@/components/usuarios-table";
import { ArchivoPanel } from "@/components/archivo-panel";
import {
  ReclamosFeedSkeleton,
  UsuariosTableSkeleton,
} from "@/components/skeletons/gestion-skeletons";
import {
  type AdminVisibility,
} from "@/lib/auth/admin-visibility";
import {
  DEMO_ASAMBLEA,
  DEMO_BIBLIOTECA,
  DEMO_PROFILES,
  demoAdminComplaints,
} from "@/lib/demo/seed";
import { DEMO_ADMIN_VISIBILITY } from "@/lib/auth/admin-visibility";

export default function AdminGestionPage() {
  const visibility = DEMO_ADMIN_VISIBILITY;
  const bibliotecaFiles = DEMO_BIBLIOTECA;
  const asambleaFiles = DEMO_ASAMBLEA;

  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Gestión de
            <span className="font-semibold text-[#1a1a1a]">l Barrio Demo</span>.
            <span className="hidden sm:inline"> Comunidad e información del barrio.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1, Col 1 — Reclamos feed (heavy). Streamed island. */}
          {visibility.canSeeReclamosFeed && (
            <Suspense
              fallback={
                <ReclamosFeedSkeleton stretchToSibling={visibility.canSeeInfo} />
              }
            >
              <ReclamosFeedIsland stretchToSibling={visibility.canSeeInfo} />
            </Suspense>
          )}

          {/* Row 1, Col 2 — Información trio (light). Paints immediately. */}
          {visibility.canSeeInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 self-start">
              <ReminderBoard />
              {visibility.canEditInfo ? (
                <CalendarEventForm />
              ) : (
                <div className="hidden sm:block" aria-hidden="true" />
              )}
              <div className="sm:col-span-2">
                <BibliotecaDigitalPanel
                  initialBibliotecaFiles={bibliotecaFiles}
                  initialAsambleaFiles={asambleaFiles}
                  canEdit={visibility.canEditInfo}
                />
              </div>
            </div>
          )}

          {/* Row 2 — Usuarios table (heavy: full profiles list). Streamed. */}
          {visibility.canSeeUsuarios && (
            <div className="md:col-span-2">
              <Suspense fallback={<UsuariosTableSkeleton />}>
                <UsuariosTableIsland visibility={visibility} />
              </Suspense>
            </div>
          )}

          {/* Row 3 — Archivo panel (no server data; renders immediately). */}
          {(visibility.canSeeFinanceArchive ||
            visibility.canSeeReclamosFeed ||
            visibility.canSeeSecurityArchive) && (
            <div className="md:col-span-2">
              <ArchivoPanel
                showFinanceArchive={visibility.canSeeFinanceArchive}
                showReclamosArchive={visibility.canSeeReclamosFeed}
                showSeguridadArchive={visibility.canSeeSecurityArchive}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReclamosFeedIsland({
  stretchToSibling,
}: {
  stretchToSibling: boolean;
}) {
  const allComplaints = demoAdminComplaints();
  if (!stretchToSibling) {
    return (
      <div className="h-[70vh] md:h-[640px]">
        <ReclamosFeed initialComplaints={allComplaints} />
      </div>
    );
  }

  return (
    <div className="md:relative md:min-h-0">
      <div className="h-[70vh] md:h-auto md:absolute md:inset-0">
        <ReclamosFeed initialComplaints={allComplaints} />
      </div>
    </div>
  );
}

function UsuariosTableIsland({ visibility }: { visibility: AdminVisibility }) {
  const allProfiles = DEMO_PROFILES;
  return (
    <UsuariosTable
      initialUsers={allProfiles}
      canManageRoles={visibility.canManageRoles}
    />
  );
}
