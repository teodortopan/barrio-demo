"use client";

import { useState, useEffect, useRef } from "react";
import { PaginatedAccountTable } from "./paginated-account-table";
import { ACCOUNT_DATA_REFRESH_EVENT, ACCOUNT_DATA_UPDATED_EVENT } from "@/lib/account-events";

interface AccountRow {
  fecha: string;
  limite: string;
  descripcion: string;
  cargo: string;
  pagos: string;
  saldo: string;
  expenseBreakdown?: Array<{ name: string; amount: string }>;
  comprobanteUrl?: string | null;
  isCurrent?: boolean;
}

interface VecinoData {
  id?: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  mes_corriente?: number;
  saldo_anterior?: number;
  fecha_pago?: string | null;
  codigo?: string | null;
  comprobante_url?: string | null;
}

interface VecinoHistoryEntry {
  id: string;
  lote: string;
  propietario: string;
  concepto: string;
  cargo: number;
  pago: number;
  saldo: number;
  estado: string;
  fecha_pago: string | null;
  comprobante_url: string | null;
  period_year: number;
  period_month: number;
  archived_at: string;
}

interface PaymentPrices {
  anticipadoEfectivo: string;
  vencido: string;
  termino: string;
  recargo: string;
}

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatARS(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  if (n < 0) return `-$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function buildHistoryRow(h: VecinoHistoryEntry): AccountRow {
  // fecha = fecha_pago in DD/MM/YY (matches current row format)
  let fecha = "";
  if (h.fecha_pago) {
    const parts = h.fecha_pago.split("-");
    if (parts.length === 3) fecha = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
    else fecha = h.fecha_pago;
  }
  // limite: 10th of the period — last anticipado/término day before recargo
  const mm = String(h.period_month).padStart(2, "0");
  const limite = `10/${mm}/${h.period_year}`;
  const descripcion = h.concepto || `Cuota de ${capitalize(MONTHS_ES[h.period_month - 1] || "")}`;
  return {
    fecha,
    limite,
    descripcion,
    cargo: formatARS(h.cargo),
    pagos: formatARS(h.pago),
    saldo: formatARS(h.saldo),
    comprobanteUrl: h.comprobante_url ?? null,
    isCurrent: false,
  };
}

interface AccountTableDataProps {
  initialVecino?: VecinoData | null;
  initialPrices?: {
    anticipadoEfectivo: string;
    vencido: string;
    termino: string;
    recargo: string;
  };
  initialHistory?: VecinoHistoryEntry[];
}

export function AccountTableData({ initialVecino, initialPrices, initialHistory }: AccountTableDataProps) {
  const hasInitial = initialVecino !== undefined && initialPrices !== undefined;
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(!hasInitial);
  const [vecinoData, setVecinoData] = useState<VecinoData | null>(initialVecino ?? null);
  const initializedRef = useRef(false);
  const vecinoDataRef = useRef<VecinoData | null>(initialVecino ?? null);
  const historyRef = useRef<VecinoHistoryEntry[]>(initialHistory ?? []);

  useEffect(() => {
    async function fetchAccountData() {
      try {
        let vecino: VecinoData | null = null;
        let allPrices: PaymentPrices | null = null;

        let historyEntries: VecinoHistoryEntry[] = historyRef.current;

        // Use initial data on first render if available
        if (hasInitial && !initializedRef.current) {
          vecino = initialVecino ?? null;
          vecinoDataRef.current = vecino;
          setVecinoData(vecino);
          allPrices = initialPrices ? {
            anticipadoEfectivo: initialPrices.anticipadoEfectivo,
            vencido: initialPrices.vencido,
            termino: initialPrices.termino,
            recargo: initialPrices.recargo,
          } : null;
          initializedRef.current = true;
        } else {
          // Fetch vecino data for current user
          const vecinoResponse = await fetch("/api/resident/vecino");
          if (vecinoResponse.ok) {
            const vecinoResult = await vecinoResponse.json();
            if (vecinoResult.vecino) {
              vecino = vecinoResult.vecino;
              vecinoDataRef.current = vecino;
              setVecinoData(vecino);
            }
            if (Array.isArray(vecinoResult.history)) {
              historyEntries = vecinoResult.history as VecinoHistoryEntry[];
              historyRef.current = historyEntries;
            }
          }

          // If API failed or no match, reuse previously loaded vecino data
          // This prevents replacing correct server-side data with a single-lote fallback
          if (!vecino) {
            vecino = vecinoDataRef.current;
          }

          // Fetch payment prices
          const paymentResponse = await fetch("/api/payments");
          const paymentResult = await paymentResponse.json();
          allPrices = paymentResult.allPrices || null;
        }

        const paymentData = { allPrices };
        if (!paymentData.allPrices) {
          setLoading(false);
          return;
        }

        window.dispatchEvent(
          new CustomEvent(ACCOUNT_DATA_UPDATED_EVENT, {
            detail: { vecino, prices: paymentData.allPrices },
          })
        );

        // Calculate current month payment info using Argentina timezone
        // This ensures we get the correct month even if the browser is in a different timezone
        const getCurrentMonthInfo = () => {
          const months = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
          ];
          // Get current date/time in Argentina timezone
          const argentinaTime = new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
          const argentinaDate = new Date(argentinaTime);
          const monthName = months[argentinaDate.getMonth()];
          // Capitalize first letter
          const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          return {
            month: argentinaDate.getMonth(),
            year: argentinaDate.getFullYear(),
            day: argentinaDate.getDate(),
            monthName: monthNameCapitalized
          };
        };

        const { month: currentMonth, year: currentYear, day: dayOfMonth, monthName } = getCurrentMonthInfo();

        // Format fecha: show fecha_pago from DB if they've paid, blank otherwise
        let fecha = "";
        if (vecino?.fecha_pago) {
          const parts = vecino.fecha_pago.split("-");
          if (parts.length === 3) {
            fecha = `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
          } else {
            fecha = vecino.fecha_pago;
          }
        }

        // Use vecino data if available, otherwise use payment prices
        let cargo = "";
        let limite = "";

        if (vecino) {
          // Use cargo from vecino data
          cargo = `$${vecino.cargo.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

          // Limite is the 10th — last day of pago a término before recargo applies
          limite = `10/${String(currentMonth + 1).padStart(2, "0")}/${currentYear}`;
        } else {
          // Fallback to payment prices if vecino data not available
          if (dayOfMonth >= 1 && dayOfMonth <= 5) {
            cargo = paymentData.allPrices.anticipadoEfectivo || "$100.000";
          } else if (dayOfMonth >= 6 && dayOfMonth <= 10) {
            cargo = paymentData.allPrices.termino || "$120.000";
          } else {
            cargo = paymentData.allPrices.recargo || "$130.000";
          }
          limite = `10/${String(currentMonth + 1).padStart(2, "0")}/${currentYear}`;
        }

        // Use pago and saldo from vecino data if available
        const pagos = vecino
          ? `$${vecino.pago.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : "$0";

        const saldo = vecino
          ? (vecino.saldo >= 0
              ? `$${vecino.saldo.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
              : `-$${Math.abs(vecino.saldo).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)
          : (() => {
              const cargoNum = parseFloat(cargo.replace(/[^0-9]/g, ""));
              const pagosNum = parseFloat(pagos.replace(/[^0-9]/g, ""));
              const saldoNum = cargoNum - pagosNum;
              return saldoNum >= 0
                ? `$${saldoNum.toLocaleString("es-AR")}`
                : `-$${Math.abs(saldoNum).toLocaleString("es-AR")}`;
            })();

        // Use concepto from vecino data if available, otherwise use default
        const descripcion = vecino && vecino.concepto
          ? vecino.concepto
          : `Cuota de ${monthName}`;

        // Build saldo breakdown
        const formatCurrency = (n: number) => {
          const value = Math.abs(n).toLocaleString("es-AR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });
          return n < 0 ? `-$${value}` : `$${value}`;
        };
        const breakdown: Array<{ name: string; amount: string }> = [];
        const cargoNum = vecino?.cargo ?? 0;
        const pagoNum = vecino?.pago ?? 0;
        const saldoAnterior = vecino?.saldo_anterior ?? 0;
        if (vecino) {
          if (saldoAnterior !== 0) {
            breakdown.push({
              name: saldoAnterior > 0 ? "Saldo anterior" : "Crédito anterior",
              amount: formatCurrency(saldoAnterior),
            });
          }
          breakdown.push({ name: descripcion, amount: formatCurrency(cargoNum) });
          if (pagoNum > 0) {
            breakdown.push({ name: "Pago registrado", amount: formatCurrency(-pagoNum) });
          }
        } else {
          breakdown.push({ name: descripcion, amount: saldo });
        }

        // Create account row for the current month
        const currentRow: AccountRow = {
          fecha,
          limite,
          descripcion,
          cargo,
          pagos,
          saldo,
          expenseBreakdown: breakdown,
          comprobanteUrl: vecino?.comprobante_url ?? null,
          isCurrent: true,
        };

        // Append history rows below — newest first (history fetcher already sorts).
        const historyRows = (historyEntries || []).map(buildHistoryRow);
        setRows([currentRow, ...historyRows]);
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();

    const handleRefreshRequest = () => {
      fetchAccountData();
    };
    window.addEventListener(ACCOUNT_DATA_REFRESH_EVENT, handleRefreshRequest);

    return () => {
      window.removeEventListener(ACCOUNT_DATA_REFRESH_EVENT, handleRefreshRequest);
    };
  }, [hasInitial, initialPrices, initialVecino]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Cargando...</div>
      </div>
    );
  }

  return <PaginatedAccountTable rows={rows} vecinoData={vecinoData} />;
}
