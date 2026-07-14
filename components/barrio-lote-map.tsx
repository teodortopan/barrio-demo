"use client";

import { useMemo, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import type { VecinoData } from "@/lib/demo/types";
import { extractLotNumbers } from "@/lib/payments/calculate-cargo-client";
import { isDemoMode } from "@/lib/demo";

interface BarrioLoteMapProps {
  initialVecinos: VecinoData[];
}

type LoteColor = "red" | "green" | "gray";

type HoverState = {
  lote: number;
  x: number;
  y: number;
  flipUp: boolean;
};

// Schematic geometry that mirrors the real plano proportions:
//  - block lotes are deep (tall) — like the 10.25m × 31.98m lotes
//  - top-strip and far-column lotes are shallow (short) — like the 10m-deep lotes
// The far column (179–193) is flush against the right edge; the block cells are
// widened so the two block columns + the far column fill the full canvas width
// (= the 42-cell top strip width). viewBox is derived from real content extents
// so nothing clips.
const TOP_CW = 20; // top-strip lote width
const G = 3; // gap between adjacent cells
const STREET = 16; // "Calle interna" gap
const TOP_H = 24; // top-strip cell height (shallow)
const BLK_H = 64; // block cell height (deep)
const FAR_CW = 72; // far-column cell width (wide, like the 38m lotes)
const FAR_COUNT = 15;

const W = 42 * TOP_CW + 41 * G; // canvas width set by the 42-cell top strip
// Widen block cells so: leftBlock + STREET + rightBlock + STREET + farColumn === W.
const BLK_CW = (W - FAR_CW - 2 * STREET - 2 * 16 * G) / 34;
const BLOCK_W = 17 * BLK_CW + 16 * G;
const LEFT_X = 0;
const RIGHT_X = BLOCK_W + STREET;
const FAR_X = W - FAR_CW; // far column flush right

const BAND1_TOP = TOP_H + STREET;
const BAND1_R2 = BAND1_TOP + BLK_H + G;
const BAND2_TOP = BAND1_R2 + BLK_H + STREET;
const BAND2_R2 = BAND2_TOP + BLK_H + G;
const BLOCK_BOTTOM = BAND2_R2 + BLK_H;
// Far column spans the block region's height exactly (15 short cells).
const FAR_H = (BLOCK_BOTTOM - BAND1_TOP - (FAR_COUNT - 1) * G) / FAR_COUNT;

const ROWS = [
  { from: 1, to: 42, x: LEFT_X, y: 0, dir: "h", kind: "top" },
  { from: 43, to: 59, x: LEFT_X, y: BAND1_TOP, dir: "h", kind: "block" },
  { from: 77, to: 93, x: LEFT_X, y: BAND1_R2, dir: "h", kind: "block" },
  { from: 111, to: 127, x: LEFT_X, y: BAND2_TOP, dir: "h", kind: "block" },
  { from: 145, to: 161, x: LEFT_X, y: BAND2_R2, dir: "h", kind: "block" },
  { from: 60, to: 76, x: RIGHT_X, y: BAND1_TOP, dir: "h", kind: "block" },
  { from: 94, to: 110, x: RIGHT_X, y: BAND1_R2, dir: "h", kind: "block" },
  { from: 128, to: 144, x: RIGHT_X, y: BAND2_TOP, dir: "h", kind: "block" },
  { from: 162, to: 178, x: RIGHT_X, y: BAND2_R2, dir: "h", kind: "block" },
  { from: 179, to: 193, x: FAR_X, y: BAND1_TOP, dir: "v", kind: "far" },
] as const;

const COLORS: Record<LoteColor, { fill: string; stroke: string; text: string; label: string }> = {
  red: { fill: "#dc2626", stroke: "#b91c1c", text: "#ffffff", label: "Deudor" },
  green: { fill: "#2d5016", stroke: "#244112", text: "#ffffff", label: "Al día / no deudor" },
  gray: { fill: "#d1d5db", stroke: "#9ca3af", text: "#374151", label: "Sin vecino (vacante)" },
};

// Color exactly by the estado the Ingresos table shows. `estado` is computed in
// fetchAllVecinos with the same logic the table renders (computeEstadoVecino),
// so "Deudor" here == "Deudor" in the table — including the after-day-10 case
// that a bare `saldo > cargo` check would miss.
function loteColor(vecino?: VecinoData): LoteColor {
  if (!vecino) return "gray";
  if (vecino.estado === "Deudor") return "red";
  return "green";
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}

function buildLotes() {
  const seen = new Set<number>();
  const lotes = ROWS.flatMap((row) =>
    Array.from({ length: row.to - row.from + 1 }, (_, index) => {
      const lote = row.from + index;
      seen.add(lote);
      if (row.kind === "far") {
        return { lote, x: row.x, y: row.y + index * (FAR_H + G), width: FAR_CW, height: FAR_H };
      }
      if (row.kind === "top") {
        return { lote, x: row.x + index * (TOP_CW + G), y: row.y, width: TOP_CW, height: TOP_H };
      }
      return { lote, x: row.x + index * (BLK_CW + G), y: row.y, width: BLK_CW, height: BLK_H };
    })
  );

  if (process.env.NODE_ENV !== "production") {
    const complete = lotes.length === 193 && seen.size === 193;
    const inRange = Array.from({ length: 193 }, (_, index) => index + 1).every((n) => seen.has(n));
    if (!complete || !inRange) {
      console.error("Barrio lote map ROWS must cover lotes 1-193 exactly once.");
    }
  }

  return lotes;
}

// Demo build: a deliberately DIFFERENT, smaller fictional layout — two
// "manzanas" of 30 lotes each (1–60) separated by a street — so the demo never
// reveals the real 193-lot plano. Same color/estado rules; the seeded vecinos
// cover most of these lotes, leaving a few gray "vacante".
function buildDemoLotes() {
  const CW = 54, CH = 46, GAP = 4, STREET_GAP = 22, COLS = 5, ROWS_N = 6;
  const blockW = COLS * CW + (COLS - 1) * GAP;
  const cells: { lote: number; x: number; y: number; width: number; height: number }[] = [];
  for (let block = 0; block < 2; block++) {
    const xOffset = block * (blockW + STREET_GAP);
    for (let r = 0; r < ROWS_N; r++) {
      for (let c = 0; c < COLS; c++) {
        const lote = block * 30 + r * COLS + c + 1;
        cells.push({ lote, x: xOffset + c * (CW + GAP), y: r * (CH + GAP), width: CW, height: CH });
      }
    }
  }
  return cells;
}

const LOTES = isDemoMode() ? buildDemoLotes() : buildLotes();
// Derive the viewBox from real content extents so no cell is ever clipped.
const VIEWBOX_W = Math.ceil(Math.max(...LOTES.map((l) => l.x + l.width)));
const VIEWBOX_H = Math.ceil(Math.max(...LOTES.map((l) => l.y + l.height)));

export function BarrioLoteMap({ initialVecinos }: BarrioLoteMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoverState | null>(null);

  const byLote = useMemo(() => {
    const map = new Map<number, VecinoData>();

    for (const vecino of initialVecinos) {
      for (const lote of extractLotNumbers(vecino.lote)) {
        const n = parseInt(lote, 10);
        if (n >= 1 && n <= 193 && !map.has(n)) {
          map.set(n, vecino);
        }
      }
    }

    return map;
  }, [initialVecinos]);

  // Each cell reports its OWN lote on enter+move, so the tooltip always matches
  // the hovered cell (no shared/stale lote source).
  const updateHover = (lote: number, clientX: number, clientY: number) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) {
      setHovered({ lote, x: clientX, y: clientY, flipUp: false });
      return;
    }
    const y = clientY - rect.top;
    setHovered({
      lote,
      x: clientX - rect.left,
      y,
      flipUp: y > rect.height * 0.55, // render above the cursor in the lower part
    });
  };

  const hoveredVecino = hovered ? byLote.get(hovered.lote) : undefined;
  const hoveredColor = loteColor(hoveredVecino);

  return (
    <section className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
          <MapPinned className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
        </div>
        <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
          Mapa del barrio
        </h2>
      </div>

      {/* Outer wrapper is the tooltip's positioning context and has NO overflow,
          so the tooltip is never clipped by the inner horizontal scroller. */}
      <div ref={wrapperRef} className="relative">
        <div className="overflow-x-auto rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3">
          <svg
            aria-label="Mapa esquemático de lotes del barrio por estado de deuda"
            className="block w-full h-auto min-w-[820px]"
            viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            onMouseLeave={() => setHovered(null)}
          >
            <g>
              {LOTES.map(({ lote, x, y, width, height }) => {
                const vecino = byLote.get(lote);
                const color = loteColor(vecino);
                const palette = COLORS[color];
                const onMove = (event: React.MouseEvent) =>
                  updateHover(lote, event.clientX, event.clientY);

                return (
                  <g key={lote}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx={3}
                      fill={palette.fill}
                      stroke={palette.stroke}
                      strokeWidth={0.8}
                      className="cursor-default transition-opacity hover:opacity-80"
                      onMouseEnter={onMove}
                      onMouseMove={onMove}
                      onMouseLeave={() => setHovered(null)}
                    />
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      fill={palette.text}
                      fontSize={width >= FAR_CW ? 10 : 8}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="central"
                      pointerEvents="none"
                    >
                      {lote}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {hovered && (
          <div
            className="pointer-events-none absolute z-20 max-w-[220px] rounded-[14px] border border-[#d9d2bf] bg-[#faf6ec] px-3 py-2 text-[10px] text-[#1a2617] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            style={{
              left: `min(${hovered.x + 14}px, calc(100% - 236px))`,
              top: hovered.flipUp ? hovered.y - 14 : hovered.y + 14,
              transform: hovered.flipUp ? "translateY(-100%)" : undefined,
            }}
          >
            <p className="mb-1 font-bold uppercase tracking-[0.04em]">Lote {hovered.lote}</p>
            {hoveredVecino ? (
              <div className="space-y-0.5">
                <p className="font-semibold">{hoveredVecino.propietario}</p>
                <p className={hoveredColor === "red" ? "text-red-700" : "text-green-700"}>
                  Estado: {hoveredVecino.estado || COLORS[hoveredColor].label}
                </p>
                <p>Saldo: {formatCurrency(hoveredVecino.saldo)}</p>
                <p>Cargo: {formatCurrency(hoveredVecino.cargo)}</p>
                <p>Pago: {formatCurrency(hoveredVecino.pago)}</p>
              </div>
            ) : (
              <p className="text-gray-700">Sin vecino registrado</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#4d6547]">
        {(["red", "green", "gray"] as const).map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-[3px]"
              style={{ backgroundColor: COLORS[c].fill }}
            />
            {COLORS[c].label}
          </span>
        ))}
        <span className="text-[#9ca3af]">· Pasá el cursor sobre un lote para ver el detalle</span>
      </div>
    </section>
  );
}
