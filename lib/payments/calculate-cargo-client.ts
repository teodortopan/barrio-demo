// Client-safe cargo calculation for the static demo.

interface PaymentPrices {
  anticipadoEfectivo: string;
  vencido: string;
  termino: string;
  recargo: string;
}

// Mirror of LOTE_SEPARATOR in lib/payments/calculate-cargo.ts. Kept inline
// This module intentionally avoids server-only helpers.
// IMPORTANT: lone whitespace must NOT be a separator — see the server file
// for the bug it caused.
const LOTE_SEPARATOR = /\s*,\s*|\s*\/\s*|\s*-\s*|\s+y\s+/i;

export function splitLotes(loteStr: string): string[] {
  if (!loteStr) return [];
  return loteStr
    .split(LOTE_SEPARATOR)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function extractLotNumbers(lote: unknown): string[] {
  if (lote === null || lote === undefined) return [];
  const s = String(lote).trim();
  if (!s) return [];
  return splitLotes(s)
    .map((p) => p.match(/\d+/)?.[0] || "")
    .filter(Boolean);
}

export function countLotes(loteStr: string): number {
  if (!loteStr) return 1;
  return Math.max(1, splitLotes(loteStr).length);
}

export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;

  let cleaned = priceStr.trim().replace(/[$€\s]/g, "");

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    const commaIndex = cleaned.indexOf(",");
    const afterComma = cleaned.substring(commaIndex + 1);
    const digitsAfterComma = afterComma.replace(/\D/g, "");

    if (digitsAfterComma.length <= 2) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "");
  }

  return parseFloat(cleaned) || 0;
}

function getTierPrice(prices: PaymentPrices, dayOfMonth: number): number {
  if (dayOfMonth >= 1 && dayOfMonth <= 5) {
    return parsePrice(prices.anticipadoEfectivo);
  } else if (dayOfMonth >= 6 && dayOfMonth <= 10) {
    return parsePrice(prices.termino);
  } else {
    return parsePrice(prices.recargo);
  }
}

/**
 * Compute the live cargo for a vecino. Mirrors the server-side logic in
 * `lib/payments/calculate-cargo.ts#calculateCargoClient`. If the resident has
 * already paid the base monthly charge (factoring credit from prior overpay),
 * the cargo is frozen — it won't escalate as the tier moves to recargo.
 */
export function calculateCargoClient(
  storedCargo: number,
  pago: number,
  lote: string,
  mesCorriente: number,
  saldoAnterior: number,
  paymentPrices: PaymentPrices,
): number {
  const argentinaTime = new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" });
  const dayOfMonth = new Date(argentinaTime).getDate();
  const numLotes = countLotes(lote);

  const baseTotal = parsePrice(paymentPrices.anticipadoEfectivo) * numLotes;
  const currentTierTotal = getTierPrice(paymentPrices, dayOfMonth) * numLotes;

  // Misma guardia anti-borrado que el cálculo del servidor: precios
  // corruptos/no parseables jamás recalculan el cargo.
  if (!(baseTotal > 0) || !(currentTierTotal > 0)) {
    return storedCargo;
  }

  const credit = saldoAnterior < 0 ? Math.abs(saldoAnterior) : 0;
  const effectivePaid = pago + credit;

  if (effectivePaid >= baseTotal) {
    return Math.max(storedCargo, mesCorriente);
  }

  return Math.max(0, currentTierTotal);
}
