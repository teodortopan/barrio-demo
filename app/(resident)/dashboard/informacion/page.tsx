import { PublicExpensesTable } from "@/components/public-expenses-table";
import { GastosPorRubroChart } from "@/components/gastos-por-rubro-chart";
import { PublicIngresosTable } from "@/components/public-ingresos-table";
import { TopDeudoresChart } from "@/components/top-deudores-chart";
import { DEMO_EXPENSES, demoDeudores } from "@/lib/demo/seed";
import { DEMO_USER_NAME } from "@/lib/demo/demo-user";

export default function InformacionMonetariaPage() {
  const firstName = DEMO_USER_NAME.split(" ")[0] || "vecino";
  const expenses = DEMO_EXPENSES;
  const deudores = demoDeudores();
  const deudoresUnavailable = deudores === null;
  const publicDeudores = (deudores ?? []).map(({ lote, propietario, concepto, cargo, saldo, estado }) => ({
    lote,
    propietario,
    concepto,
    cargo,
    saldo,
    estado,
  }));

  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Welcome line — page title lives in the topbar */}
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Hola <span className="font-semibold text-[#1a1a1a] capitalize">{firstName}</span>, acá tenés la información económica del barrio.
            <span className="hidden sm:inline"> Egresos del mes y distribución por rubro.</span>
          </p>
        </div>

        {/* Mobile order: egresos table, ingresos table, egresos chart,
            deudores chart. Achieved with `order` utilities; on lg they all
            reset to `lg:order-none` so DOM order drives the desktop grid. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PublicExpensesTable
              initialRows={expenses.map((e) => ({
                fecha: e.fecha,
                concepto: e.concepto,
                saldo: e.saldo,
                estado: e.estado,
                comprobante: e.comprobante,
                factura: e.factura,
              }))}
            />
          </div>
          <div className="order-3 lg:order-none">
            <GastosPorRubroChart
              initialExpenses={expenses.map((e) => ({
                fecha: e.fecha,
                categoria: e.categoria,
                saldo: e.saldo,
                estado: e.estado,
              }))}
            />
          </div>

          {/* Ingresos · Deudores — same width as egresos (col-span-2) */}
          <div className="lg:col-span-2">
            <PublicIngresosTable initialRows={publicDeudores} unavailable={deudoresUnavailable} />
          </div>

          {/* Top deudores chart — sits in the empty col-3 slot of row 2,
              same dimensions as the gastos chart above it. */}
          <div className="order-4 lg:order-none">
            <TopDeudoresChart
              tourId="info-top-deudores"
              unavailable={deudoresUnavailable}
              initialRows={[...publicDeudores]
                .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
                .slice(0, 10)
                .map((d) => ({ lote: d.lote, propietario: d.propietario, saldo: d.saldo }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
