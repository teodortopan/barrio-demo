import { Suspense } from "react";
import { ArrowDownToLine, Coins, TrendingUp, Wallet, Zap } from "lucide-react";
import { EditablePaymentCards } from "@/components/editable-payment-cards";
import { VecinosTable } from "@/components/vecinos-table";
import { ExpensesSection } from "@/components/expenses-section";
import { ConsumoElectricoSection } from "@/components/consumo-electrico-section";
import { FinancialSummaryDisplay } from "@/components/financial-summary-display";
import { PendingPaymentsButton } from "@/components/pending-payments-button";
import { PaymentPieCharts } from "@/components/payment-pie-charts";
import { BarrioLoteMap } from "@/components/barrio-lote-map";
import {
  CajaResumenChartsSkeleton,
  CajaTablesSkeleton,
} from "@/components/skeletons/caja-skeletons";
import { buildFinancialSummary } from "@/lib/admin/financial-summary";
import {
  type AdminVisibility,
} from "@/lib/auth/admin-visibility";
import { DEMO_ADMIN_VISIBILITY } from "@/lib/auth/admin-visibility";
import {
  DEMO_CONSUMO,
  DEMO_EXPENSES,
  DEMO_PAYMENT_PRICES,
  demoVecinos,
} from "@/lib/demo/seed";

export default function AdminCajaPage() {
  const visibility = DEMO_ADMIN_VISIBILITY;

  // Payment prices paint immediately at the top of the page.
  // Heavy data (vecinos + expenses) streams via the two Suspense islands
  // Both islands receive the same fictional, in-memory seed data.
  // round-trip per request.
  const prices = visibility.canSeeFinance ? DEMO_PAYMENT_PRICES : null;

  const initialPayments = prices ? [
    { id: "anticipado-efectivo", title: "PAGO ANTICIPADO", subtitle: "Hasta el 5", amount: prices.anticipadoEfectivo, bgColor: "bg-green-500" },
    { id: "termino", title: "PAGO A TÉRMINO", subtitle: "Del 6 al 10", amount: prices.termino, bgColor: "bg-yellow-500" },
    { id: "recargo", title: "PAGO CON RECARGO", subtitle: "Del 11 a fin de mes", amount: prices.recargo, bgColor: "bg-orange-500" },
    { id: "vencido", title: "PAGO VENCIDO", subtitle: "Mes siguiente", amount: prices.vencido, bgColor: "bg-red-500" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Caja de
            <span className="font-semibold text-[#1a1a1a]">l Barrio Demo</span>.
            <span className="hidden sm:inline"> Ingresos, egresos y posición financiera del barrio.</span>
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-x-8 gap-y-6 overflow-hidden ${visibility.canSeeFinance ? "lg:grid-cols-[5fr_2fr]" : ""}`}>
          {/* Row 1: Administración financiera (full width, paints immediately). */}
          {visibility.canSeeFinance && (
            <div
              className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 min-w-0 lg:col-span-2"
              id="admin-financiera"
              data-tour-id="caja-admin-financiera"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <Wallet className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                  Administración financiera
                </h2>
              </div>
              <EditablePaymentCards initialPayments={initialPayments} />
            </div>
          )}

          {/* Row 2, Col 1: Ingresos + Egresos tables — streamed island. */}
          <Suspense fallback={<CajaTablesSkeleton />}>
            <CajaTablesIsland visibility={visibility} />
          </Suspense>

          {/* Row 2, Col 2: Resumen financiero + charts — streamed island.
              Same heavy fetches as the tables island; cache() dedupes them
              without making a network request. */}
          {visibility.canSeeFinance && (
            <Suspense fallback={<CajaResumenChartsSkeleton />}>
              <CajaResumenChartsIsland />
            </Suspense>
          )}
        </div>

        {visibility.canSeeFinance && (
          <div className="mt-6" data-tour-id="caja-mapa">
            <Suspense fallback={<CajaMapSkeleton />}>
              <BarrioMapIsland />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

function CajaMapSkeleton() {
  return (
    <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 min-h-[300px]" />
  );
}

function BarrioMapIsland() {
  const vecinos = demoVecinos();
  return <BarrioLoteMap initialVecinos={vecinos} />;
}

function CajaTablesIsland({ visibility }: { visibility: AdminVisibility }) {
  const vecinos = visibility.canSeeFinance ? demoVecinos() : [];
  const expenses = visibility.canSeeEgresos ? DEMO_EXPENSES : [];
  const consumoElectrico = visibility.canSeeConsumo ? DEMO_CONSUMO : [];

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {visibility.canSeeFinance && (
        <div
          className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 overflow-hidden"
          data-tour-id="caja-ingresos"
        >
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
              <TrendingUp className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">Ingresos</h2>
            {visibility.canEditFinance && (
              <div className="ml-auto" data-tour-id="caja-pagos-pendientes">
                <PendingPaymentsButton />
              </div>
            )}
          </div>
          <VecinosTable
            initialData={vecinos}
            readOnly={!visibility.canEditFinance}
            showAddButton={visibility.canEditFinance}
          />
        </div>
      )}

      {visibility.canSeeEgresos && (
        <div
          className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 overflow-hidden"
          data-tour-id="caja-egresos"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
              <ArrowDownToLine className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">Egresos</h2>
          </div>
          <ExpensesSection
            initialRows={expenses}
            canCreate={visibility.canCreateEgresos}
            canManage={visibility.canEditEgresos}
          />
        </div>
      )}

      {visibility.canSeeConsumo && (
        <div
          className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 overflow-hidden"
          data-tour-id="caja-consumo"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
              <Zap className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
              Consumo eléctrico
            </h2>
          </div>
          <ConsumoElectricoSection
            initialRows={consumoElectrico}
            readOnly={!visibility.canEditEgresos}
          />
        </div>
      )}
    </div>
  );
}

function CajaResumenChartsIsland() {
  const vecinos = demoVecinos();
  const expenses = DEMO_EXPENSES;
  const summary = buildFinancialSummary(vecinos, expenses);

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div
        id="total-dinero"
        data-tour-id="caja-resumen"
        className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
            <Coins className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
          </div>
          <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
            Resumen financiero
          </h2>
        </div>
        <FinancialSummaryDisplay
          proyectado={summary.proyectado}
          cobrado={summary.cobrado}
          porCobrar={summary.porCobrar}
          deuda={summary.deuda}
          posicionCaja={summary.posicionCaja}
          gastosProyectados={summary.gastosProyectados}
          pasivos={summary.pasivos}
        />
      </div>

      <div className="flex-1 flex flex-col" data-tour-id="caja-graficos">
        <PaymentPieCharts initialVecinos={vecinos} initialExpenses={expenses} />
      </div>
    </div>
  );
}
