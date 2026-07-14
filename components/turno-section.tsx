"use client";

import { useState, useEffect } from "react";

interface CurrentShift {
  guard_name: string;
  next_shift_guard: string | null;
  next_shift_time: string | null;
}

interface TurnoSectionProps {
  initialShift?: CurrentShift | null;
}

export function TurnoSection({ initialShift }: TurnoSectionProps) {
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(initialShift ?? null);
  const [loading, setLoading] = useState(initialShift === undefined);

  useEffect(() => {
    if (initialShift !== undefined) {
      // Still start polling, just skip first fetch
      const interval = setInterval(() => {
        if (!document.hidden) fetchCurrentShift();
      }, 60000);
      const handleVisibility = () => {
        if (!document.hidden) fetchCurrentShift();
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibility);
      };
    }

    fetchCurrentShift();
    const interval = setInterval(() => {
      if (!document.hidden) fetchCurrentShift();
    }, 60000);
    const handleVisibility = () => {
      if (!document.hidden) fetchCurrentShift();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [initialShift]);

  async function fetchCurrentShift() {
    try {
      const response = await fetch("/api/seguridad/current-shift");
      const result = await response.json();

      if (result.error) {
        console.error("Error fetching current shift:", result.error);
      } else {
        setCurrentShift(result.shift || null);
      }
    } catch (error) {
      console.error("Error fetching current shift:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[14px] bg-white border border-gray-200 shadow-sm p-6 text-center text-sm text-[#4d6547]">
        Cargando turno…
      </div>
    );
  }

  const guardName = currentShift?.guard_name || "No asignado";
  const nextTime = currentShift?.next_shift_time
    ? new Date(currentShift.next_shift_time).toLocaleString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--forest-300)",
    marginBottom: 10,
  };

  const dashedDivider = "rgba(245, 239, 227, 0.2)";
  const formattedNextTime = nextTime ? nextTime.replace(",", " ·") : null;

  return (
    <div
      className="relative overflow-hidden rounded-[14px] border px-6 py-6 sm:px-10 sm:py-7"
      style={{
        background: "#293219",
        borderColor: "#293219",
        color: "var(--cream-100)",
      }}
    >
      <div className="grid items-stretch gap-6 md:gap-0 grid-cols-1 md:grid-cols-3">
        {/* Left — Contacto guardia */}
        <div className="md:pr-8 flex flex-col items-start md:items-center text-left md:text-center">
          <div style={eyebrowStyle}>Contacto guardia</div>
          <a
            href="tel:+5491155550000"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-xl font-bold tracking-wide border transition-colors hover:opacity-90"
            style={{
              background: "var(--earth-600)",
              color: "var(--cream-50)",
              borderColor: "var(--earth-700)",
            }}
          >
            11 5555-0000
          </a>
          <div
            className="mt-2"
            style={{ color: "var(--cream-200)", fontSize: 12 }}
          >
            Disponible 24 hs
          </div>
        </div>

        {/* Middle — Turno actual */}
        <div
          className="md:px-8 flex flex-col items-start md:items-center text-left md:text-center md:border-l md:border-r md:border-dashed pt-6 md:pt-0 border-t md:border-t-0 border-dashed"
          style={{ borderColor: dashedDivider }}
        >
          <div style={eyebrowStyle}>Turno actual</div>
          <div
            className="truncate max-w-full"
            style={{
              fontWeight: 700,
              fontSize: 32,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              color: "var(--cream-50)",
            }}
          >
            {guardName}
          </div>
          <div
            className="mt-2"
            style={{ color: "var(--cream-200)", fontSize: 12 }}
          >
            En servicio ahora
          </div>
        </div>

        {/* Right — Siguiente turno */}
        <div className="md:px-8 flex flex-col items-start md:items-center text-left md:text-center pt-6 md:pt-0 border-t md:border-t-0 border-dashed"
          style={{ borderColor: dashedDivider }}
        >
          <div style={eyebrowStyle}>Siguiente turno</div>
          {currentShift?.next_shift_guard ? (
            <>
              <div
                className="truncate max-w-full"
                style={{
                  fontWeight: 600,
                  fontSize: 22,
                  lineHeight: 1.1,
                  color: "var(--cream-50)",
                }}
              >
                {currentShift.next_shift_guard}
              </div>
              {formattedNextTime && (
                <div
                  className="mt-1.5 font-mono"
                  style={{ color: "var(--forest-300)", fontSize: 12 }}
                >
                  {formattedNextTime}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                lineHeight: 1.1,
                color: "var(--cream-200)",
              }}
            >
              Sin programar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
