"use client";

import { Users, Eye, CalendarDays, UserCheck } from "lucide-react";
import { IngresantesSection } from "./ingresantes-section";
import { TurnoSection } from "./turno-section";
import { VigilanciaSection } from "./vigilancia-section";
import { VisitasSection } from "./visitas-section";
import { GuardShiftCalendar } from "./guard-shift-calendar";

interface Ingresante {
  id: string;
  lote: string;
  nombre_apellido: string;
  tipo: "Propietario" | "Visita" | "Empleado";
  horario: string;
  documentacion: string | null;
}

interface CurrentShift {
  guard_name: string;
  next_shift_guard: string | null;
  next_shift_time: string | null;
}

interface Recorrido {
  id: string;
  recorrido_time: string;
  notes: string | null;
  recorrido_date: string;
}

interface GuardShift {
  id: string;
  guard_name: string;
  shift_date: string;
  shift_time: string;
  notes: string | null;
}

interface SeguridadPageContentProps {
  initialIngresantes?: Ingresante[];
  initialShift?: CurrentShift | null;
  initialRecorridos?: Recorrido[];
  initialGuardShifts?: GuardShift[];
  initialShiftsMap?: Record<string, GuardShift[]>;
  canEditSecurity?: boolean;
  canEditIngresantes?: boolean;
  canEditRecorridos?: boolean;
  canEditCalendar?: boolean;
}

export function SeguridadPageContent({
  initialIngresantes,
  initialShift,
  initialRecorridos,
  initialGuardShifts,
  initialShiftsMap,
  canEditSecurity = true,
  canEditIngresantes,
  canEditRecorridos,
  canEditCalendar = true,
}: SeguridadPageContentProps) {
  const mayEditIngresantes = canEditIngresantes ?? canEditSecurity;
  const mayEditRecorridos = canEditRecorridos ?? canEditSecurity;

  return (
    <div className="min-h-screen bg-[#E9E7E1]">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Welcome line — page title lives in the topbar */}
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            Gestión interna de
            <span className="font-semibold text-[#1a1a1a]">l Barrio Demo</span>.
            <span className="hidden sm:inline"> Turnos, ingresantes, vigilancia y archivo de guardia.</span>
          </p>
        </div>

        {/* Turno hero card */}
        <div className="mb-6" data-tour-id="seg-turno">
          <TurnoSection initialShift={initialShift} />
        </div>

        {/* Main Content - Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column - Ingresantes */}
          <div className="lg:col-span-2 flex flex-col">
            <div
              className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col flex-1"
              data-tour-id="seg-ingresantes"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <Users className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                  Ingresantes
                </h2>
              </div>
              <IngresantesSection initialData={initialIngresantes} readOnly={!mayEditIngresantes} />
            </div>
          </div>

          {/* Right Column - Vigilancia, Calendar, and Archivo */}
          <div className="flex flex-col gap-6">
            {/* Vigilancia Section */}
            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6" data-tour-id="seg-vigilancia">
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <Eye className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                  Vigilancia
                </h2>
              </div>
              <VigilanciaSection initialRecorridos={initialRecorridos} readOnly={!mayEditRecorridos} />
            </div>

            {/* Visitas */}
            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6" data-tour-id="seg-visitas">
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <UserCheck className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                  Visitas
                </h2>
              </div>
              <VisitasSection />
            </div>

            {/* Calendario de turnos — flex-1 absorbs any leftover vertical
                space so the card's bottom edge aligns with the Ingresantes
                table on the left. */}
            <div
              className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 flex flex-col flex-1"
              data-tour-id="seg-calendario"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                  <CalendarDays className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
                </div>
                <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                  Calendario de turnos
                </h2>
              </div>
              <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 p-3 flex-1">
                <GuardShiftCalendar initialShifts={initialGuardShifts} initialShiftsMap={initialShiftsMap} readOnly={!canEditCalendar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
