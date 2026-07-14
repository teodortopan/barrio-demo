"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id?: string;
  date: number;
  month: number;
  year: number;
  event: string;
}

interface InteractiveCalendarProps {
  initialEvents?: CalendarEvent[];
  canDelete?: boolean;
}

export function InteractiveCalendar({ initialEvents = [], canDelete = false }: InteractiveCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const yearSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar-events");
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      } catch {
        /* keep initialEvents on failure */
      }
    }
    fetchEvents();
  }, []);

  // Close year selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        yearSelectorRef.current &&
        !yearSelectorRef.current.contains(event.target as Node)
      ) {
        setIsYearSelectorOpen(false);
      }
    };

    if (isYearSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isYearSelectorOpen]);

  const monthNames = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const daysOfWeek = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const isToday = (day: number) => {
    const checkDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  const getEventForDate = (day: number) => {
    return events.find(
      (e) =>
        e.date === day &&
        e.month === currentDate.getMonth() + 1 && // API returns 1-12, JS months are 0-11
        e.year === currentDate.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };


  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setIsYearSelectorOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getFirstDayOfWeek(currentDate);
  const currentMonth = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Generate year options (current year ± 5 years)
  const currentYearNum = today.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYearNum - 5 + i);

  return (
    <>
      <div className="bg-[#FBF8EF] p-4">
        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between mb-4 relative">
          <button
            onClick={handlePreviousMonth}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="relative" ref={yearSelectorRef}>
            <button
              onClick={() => setIsYearSelectorOpen(!isYearSelectorOpen)}
              className="inline-flex items-center px-3 py-1 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-xs font-bold uppercase tracking-wider hover:bg-[#2d5016]/15 transition-colors"
            >
              {currentMonth} {currentYear}
            </button>
            {/* Year Selector Dropdown */}
            {isYearSelectorOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20 bg-white border border-[#E9E2CE] rounded-[14px] shadow-lg p-1.5 max-h-40 overflow-y-auto w-[180px]">
                <div className="grid grid-cols-2 gap-1">
                  {yearOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className={`px-2 py-1 text-xs font-semibold rounded-[14px] transition-colors w-full text-center ${
                        year === currentYear
                          ? "bg-[#2d5016] text-white"
                          : "text-[#1a2617] hover:bg-[#2d5016]/10"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleNextMonth}
            className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-xs font-semibold text-gray-700 text-center py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const event = getEventForDate(day);
            const isCurrentDay = isToday(day);
            // Dynamic font size for desktop based on text length
            const eventFontSize = event
              ? event.event.length <= 8
                ? "11px"
                : event.event.length <= 15
                ? "9px"
                : event.event.length <= 25
                ? "8px"
                : "7px"
              : undefined;

            return (
              <div
                key={day}
                onClick={() => event && setSelectedEvent(event)}
                className={`aspect-square flex flex-col items-center justify-center text-xs border border-gray-300 rounded relative overflow-hidden ${
                  isCurrentDay
                    ? "bg-[#2d5016] text-white border-[#2d5016] font-semibold"
                    : "text-[#1a1a1a]"
                } ${event ? "cursor-pointer" : ""}`}
              >
                <span>{day}</span>
                {event && (
                  <>
                    {/* Mobile: red dot only */}
                    <div
                      className={`w-2 h-2 rounded-full mt-0.5 sm:hidden ${
                        isCurrentDay ? "bg-white" : "bg-red-600"
                      }`}
                    />
                    {/* Desktop: dot + dynamic text */}
                    <div
                      className={`hidden sm:flex flex-col items-center`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isCurrentDay ? "bg-white" : "bg-red-600"
                        }`}
                      />
                      <span
                        className={`mt-0.5 leading-tight text-center px-0.5 break-words ${
                          isCurrentDay ? "text-white" : "text-red-600"
                        }`}
                        style={{ fontSize: eventFontSize, lineHeight: "1.1", maxHeight: "70%", overflow: "hidden" }}
                      >
                        {event.event}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => { setSelectedEvent(null); setShowDeleteConfirm(false); }}
        >
          <div
            className="bg-white rounded-[14px] shadow-lg w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-[#2d5016]" />
              <h3 className="text-lg font-bold text-[#1a1a1a]">
                {selectedEvent.date}/{selectedEvent.month}/{selectedEvent.year}
              </h3>
            </div>
            <p className="text-sm text-[#1a1a1a]">{selectedEvent.event}</p>
            {canDelete && selectedEvent.id && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-[14px] hover:bg-red-700 transition-colors"
              >
                Eliminar evento
              </button>
            )}
            {showDeleteConfirm && (
              <div className="mt-4 p-3 bg-red-50 rounded-[14px] border border-red-200">
                <p className="text-sm text-red-600 mb-2">¿Estás seguro de que querés eliminar este evento?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-[#1a1a1a] bg-white rounded-[14px] border border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedEvent.id) return;
                      setDeleting(true);
                      try {
                        const res = await fetch(`/api/calendar-events/delete?id=${selectedEvent.id}`, { method: "DELETE" });
                        const data = await res.json();
                        if (data.success) {
                          setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                          setSelectedEvent(null);
                          setShowDeleteConfirm(false);
                        }
                      } catch (error) {
                        console.error("Error deleting event:", error);
                      } finally {
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-[14px] hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => { setSelectedEvent(null); setShowDeleteConfirm(false); }}
              className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-[#2d5016] rounded-[14px] hover:bg-[#3a6a1f] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
