import { Suspense } from "react";
import { PaymentDisplay } from "@/components/payment-display";
import {
  EstadoCombinado,
  VisitaActionCard,
  ReclamoActionCard,
} from "@/components/mi-gestion-sections";
import { AnnouncementsDisplay } from "@/components/announcements-display";
import { AccountTableData } from "@/components/account-table-data";
import { SaldoStatusDisplay } from "@/components/saldo-status-display";
import { TopDeudoresChart } from "@/components/top-deudores-chart";
import { LatestEncuestaCard } from "@/components/latest-encuesta-card";
import {
  CuentaCorrienteSkeleton,
  MiGestionSkeleton,
} from "@/components/skeletons/dashboard-skeletons";
import {
  type VecinoData,
  type PaymentPricesData,
} from "@/lib/demo/types";
import {
  DEMO_PAYMENT_PRICES,
  demoDeudores,
  demoReminders,
  demoResidentVecino,
  demoUserComplaints,
  demoUserVisits,
  demoVecinoHistory,
} from "@/lib/demo/seed";
import { DEMO_USER_NAME } from "@/lib/demo/demo-user";

export default function DashboardPage() {
  const firstName = DEMO_USER_NAME.split(" ")[0] || "vecino";

  // Light, fast fetches — used by the top row (Payment display + Announcements).
  // The user's own vecino row is cheap (single profile_id lookup).
  const prices = DEMO_PAYMENT_PRICES;
  const reminders = demoReminders("recordatorio");
  const vecino = demoResidentVecino();
  const deudores = demoDeudores();

  const deudoresUnavailable = deudores === null;
  const topDeudores = (deudores ?? [])
    .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
    .slice(0, 10)
    .map((d) => ({ lote: d.lote, propietario: d.propietario, saldo: d.saldo }));

  const initialSaldo = vecino ? vecino.saldo : null;
  const initialCargo = vecino ? vecino.cargo : null;

  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Hola <span className="font-semibold text-[#1a1a1a] capitalize">{firstName}</span>, ¡qué bueno verte por acá!
            <span className="hidden sm:inline"> Esta es tu información actualizada.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr] gap-8">
          {/* Row 1, col 1 — Estado de cuenta (narrower, centered). */}
          <div className="lg:row-start-1">
            <PaymentDisplay
              initialPrices={prices}
              initialVecino={vecino}
            />
          </div>

          {/* Row 1, col 2 — Recordatorios. */}
          <div className="lg:row-start-1">
            <AnnouncementsDisplay initialReminders={reminders} />
          </div>

          {/* Row 1, col 3 — Activo en comunidad (última encuesta abierta). */}
          <div className="lg:row-start-1">
            <LatestEncuestaCard />
          </div>

          {/* Row 2, cols 1-2 — Cuenta corriente (heavy: history). Streamed. */}
          <div className="lg:col-span-2 lg:row-start-2">
            <Suspense fallback={<CuentaCorrienteSkeleton />}>
              <CuentaCorrienteIsland
                vecino={vecino}
                prices={prices}
                initialSaldo={initialSaldo}
                initialCargo={initialCargo}
              />
            </Suspense>
          </div>

          {/* Row 2, col 3 — Mi gestión (heavy: visits + complaints). Streamed. */}
          <div className="lg:row-start-2">
            <Suspense fallback={<MiGestionSkeleton />}>
              <MiGestionIsland />
            </Suspense>
          </div>

          {/* Row 3 — Top deudores (full width). */}
          <div className="lg:col-span-3 lg:row-start-3">
            <TopDeudoresChart
              tourId="top-deudores"
              initialRows={topDeudores}
              unavailable={deudoresUnavailable}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CuentaCorrienteIsland({
  vecino,
  prices,
  initialSaldo,
  initialCargo,
}: {
  vecino: VecinoData | null;
  prices: PaymentPricesData;
  initialSaldo: number | null;
  initialCargo: number | null;
}) {
  const history = vecino ? demoVecinoHistory() : [];

  return (
    <div data-tour-id="cuenta-corriente" className="relative bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col w-full h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
            Cuenta corriente
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center px-2.5 py-1 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 shadow-[0_1px_0_rgba(45,80,22,0.04)]">
            <SaldoStatusDisplay initialSaldo={initialSaldo} initialCargo={initialCargo} />
          </div>
        </div>
      </div>

      <AccountTableData
        initialVecino={vecino}
        initialPrices={prices}
        initialHistory={history}
      />
    </div>
  );
}

function MiGestionIsland() {
  const complaints = demoUserComplaints();
  const visits = demoUserVisits();

  return (
    <div data-tour-id="mi-gestion" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Mi gestión
        </h2>
      </div>

      <div className="space-y-4">
        <VisitaActionCard />
        <ReclamoActionCard />
        <EstadoCombinado initialVisits={visits} initialComplaints={complaints} />
      </div>
    </div>
  );
}
