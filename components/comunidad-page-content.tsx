"use client";

import { Calendar } from "lucide-react";
import { InteractiveCalendar } from "@/components/interactive-calendar";
import { NovedadesDisplay } from "@/components/novedades-display";
import { VotacionesPanel } from "@/components/votaciones-panel";

interface Novedad {
  id: string;
  type: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface CalendarEvent {
  id?: string;
  date: number;
  month: number;
  year: number;
  event: string;
}

interface ComunidadPageContentProps {
  initialNovedades?: Novedad[];
  initialCalendarEvents?: CalendarEvent[];
  canDeleteEvents?: boolean;
}

export function ComunidadPageContent({
  initialNovedades,
  initialCalendarEvents,
  canDeleteEvents = false,
}: ComunidadPageContentProps) {
  return (
    <div className="min-h-screen bg-[#E9E7E1] pb-16">
      <div className="max-w-[90rem] mx-auto px-3 sm:px-4 lg:px-6 py-6">
        {/* Welcome line — page title lives in the topbar */}
        <div className="mb-6">
          <p className="text-sm text-[#3c3c3c]">
            La vida del barrio en un solo lugar.
            <span className="hidden sm:inline"> Novedades de la administración y fechas clave del calendario.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-stretch">
          {/* Top left: Votaciones */}
          <VotacionesPanel />

          {/* Top right: Novedades */}
          <NovedadesDisplay initialReminders={initialNovedades} />

          {/* Bottom left: Calendario */}
          <div data-tour-id="comunidad-calendario" className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 relative flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-[14px] bg-[#2d5016]/10">
                <Calendar className="w-4 h-4 text-[#2d5016]" strokeWidth={1.8} />
              </div>
              <h2 className="text-lg font-bold text-[#1a1a1a] leading-tight uppercase">
                Calendario
              </h2>
            </div>
            <div className="flex-1 flex flex-col rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
              <InteractiveCalendar initialEvents={initialCalendarEvents} canDelete={canDeleteEvents} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
