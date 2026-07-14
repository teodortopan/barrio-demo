"use client";

import { useState, useEffect } from "react";
import { ACCOUNT_DATA_UPDATED_EVENT, type AccountDataUpdatedDetail } from "@/lib/account-events";

interface SaldoStatusDisplayProps {
  initialSaldo?: number | null;
  initialCargo?: number | null;
}

const toNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (val === undefined || val === null) return 0;
  const str = String(val).replace(/\./g, "").replace(",", ".");
  return parseFloat(str) || 0;
};

export function SaldoStatusDisplay({ initialSaldo, initialCargo }: SaldoStatusDisplayProps) {
  const [saldo, setSaldo] = useState<number | null>(initialSaldo !== undefined ? initialSaldo : null);
  const [cargo, setCargo] = useState<number | null>(initialCargo !== undefined ? initialCargo : null);
  const [loading, setLoading] = useState(initialSaldo === undefined);

  useEffect(() => {
    const handleAccountUpdate = (event: Event) => {
      const detail = (event as CustomEvent<AccountDataUpdatedDetail>).detail;
      const nextSaldo = detail.vecino?.saldo;
      if (typeof nextSaldo === "number") {
        setSaldo(nextSaldo);
      } else if (nextSaldo !== undefined && nextSaldo !== null) {
        setSaldo(toNumber(nextSaldo));
      } else {
        setSaldo(0);
      }
      const nextCargo = detail.vecino?.cargo;
      if (nextCargo === undefined || nextCargo === null) {
        setCargo(0);
      } else {
        setCargo(toNumber(nextCargo));
      }
      setLoading(false);
    };

    window.addEventListener(ACCOUNT_DATA_UPDATED_EVENT, handleAccountUpdate);
    return () => {
      window.removeEventListener(ACCOUNT_DATA_UPDATED_EVENT, handleAccountUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <span className="px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-xs font-medium">
          Cargando…
        </span>
      </div>
    );
  }

  const saldoValue = saldo !== null ? Number(saldo) : 0;
  const cargoValue = cargo !== null ? Number(cargo) : 0;
  const isAlDia = saldoValue <= 0;
  // Rolled-over debt (saldo greater than the current period's cargo) is
  // always Deudor, regardless of day of month.
  const isDeudorByRollover = saldoValue > 0 && saldoValue > cargoValue;

  // Determine label and color based on day of month (Argentina timezone)
  const argDay = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getDate();

  let statusLabel: string;
  let pillBg: string;
  let pillText: string;
  let dotColor: string;

  if (isAlDia) {
    statusLabel = "Al día";
    pillBg = "bg-green-50";
    pillText = "text-green-700";
    dotColor = "bg-green-600";
  } else if (isDeudorByRollover) {
    statusLabel = "Deudor";
    pillBg = "bg-red-50";
    pillText = "text-red-700";
    dotColor = "bg-red-600";
  } else if (argDay <= 5) {
    statusLabel = "A pagar";
    pillBg = "bg-green-50";
    pillText = "text-green-700";
    dotColor = "bg-green-600";
  } else if (argDay <= 10) {
    statusLabel = "A pagar";
    pillBg = "bg-orange-50";
    pillText = "text-orange-600";
    dotColor = "bg-orange-500";
  } else {
    statusLabel = "Deudor";
    pillBg = "bg-red-50";
    pillText = "text-red-700";
    dotColor = "bg-red-600";
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs font-bold text-[#1a1a1a] whitespace-nowrap">Saldo actual</span>
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[14px] text-xs font-semibold whitespace-nowrap ${pillBg} ${pillText}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {statusLabel}
      </span>
    </div>
  );
}
