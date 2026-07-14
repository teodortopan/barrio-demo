"use client";

import { useCallback, useState, useEffect, useLayoutEffect, useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { getArgentinaDate } from "@/lib/utils/argentina-date";

interface GuardShift {
  id: string;
  guard_name: string;
  shift_date: string;
  shift_time: string;
  notes: string | null;
}

interface GuardShiftCalendarProps {
  initialShifts?: GuardShift[];
  initialShiftsMap?: Record<string, GuardShift[]>;
  readOnly?: boolean;
}

export function GuardShiftCalendar({ initialShifts, initialShiftsMap, readOnly = false }: GuardShiftCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => getArgentinaDate());
  const [cache, setCache] = useState<Record<string, GuardShift[]>>(() => {
    const initial: Record<string, GuardShift[]> = {};
    if (initialShiftsMap) {
      Object.assign(initial, initialShiftsMap);
    } else if (initialShifts) {
      const now = getArgentinaDate();
      initial[`${now.getFullYear()}-${now.getMonth() + 1}`] = initialShifts;
    }
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("08:00");
  const [addLoading, setAddLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const fetchingRef = useRef<Set<string>>(new Set());
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const todayRowRef = useRef<HTMLButtonElement | null>(null);

  const cacheKey = useCallback((y: number, m: number) => `${y}-${m}`, []);

  const fetchMonthShifts = useCallback(async (y: number, m: number) => {
    const key = cacheKey(y, m);
    if (fetchingRef.current.has(key)) return;
    fetchingRef.current.add(key);
    try {
      const response = await fetch(`/api/seguridad/shifts?year=${y}&month=${m}`);
      const result = await response.json();
      if (!result.error) {
        setCache(prev => ({ ...prev, [key]: result.shifts || [] }));
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    } finally {
      fetchingRef.current.delete(key);
    }
  }, [cacheKey]);

  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const key = cacheKey(y, m);

    if (!cache[key]) {
      setLoading(true);
      fetchMonthShifts(y, m).then(() => setLoading(false));
    }

    // Prefetch adjacent months
    const prev = new Date(y, m - 2, 1);
    const next = new Date(y, m, 1);
    if (!cache[cacheKey(prev.getFullYear(), prev.getMonth() + 1)]) {
      fetchMonthShifts(prev.getFullYear(), prev.getMonth() + 1);
    }
    if (!cache[cacheKey(next.getFullYear(), next.getMonth() + 1)]) {
      fetchMonthShifts(next.getFullYear(), next.getMonth() + 1);
    }
  }, [cache, cacheKey, currentDate, fetchMonthShifts]);

  const shifts = cache[cacheKey(currentDate.getFullYear(), currentDate.getMonth() + 1)] || [];

  async function fetchShifts() {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const key = cacheKey(y, m);
    fetchingRef.current.delete(key);
    await fetchMonthShifts(y, m);
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleYearClick = () => {
    setSelectedYear(currentDate.getFullYear());
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setSelectedYear(null);
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length < 42) {
    calendarDays.push(null);
  }

  // Sort chronologically - 00:00 = night shift, sorts last (same as current-shift API)
  const sortShiftsByTime = (list: GuardShift[]) =>
    [...list].sort((a, b) => {
      const toSortMinutes = (t: string) => {
        const m = t.match(/(\d{1,2}):(\d{2})/);
        if (!m) return 0;
        const mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        return mins === 0 ? 24 * 60 : mins; // 00:00 = last (night shift)
      };
      return toSortMinutes(a.shift_time) - toSortMinutes(b.shift_time);
    });

  const getShiftsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sortShiftsByTime(shifts.filter(s => s.shift_date === dateStr));
  };

  const getShiftsForDateStr = (dateStr: string) =>
    sortShiftsByTime(shifts.filter(s => s.shift_date === dateStr));

  const formatShiftTime = (shiftTime: string) => {
    const m = shiftTime.match(/(\d{1,2}):(\d{2})/);
    if (!m) return shiftTime;
    return `${m[1].padStart(2, "0")}:${m[2]}`;
  };

  const openDayModal = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayShifts = shifts.filter(s => s.shift_date === dateStr);
    const takenTimes = dayShifts.map(s => s.shift_time.slice(0, 5));
    const defaultTime = !takenTimes.includes("07:00") ? "07:00"
      : !takenTimes.includes("15:00") ? "15:00"
      : "23:00";
    setSelectedDayDate(dateStr);
    setNewName("");
    setNewTime(defaultTime);
  };

  const closeDayModal = () => setSelectedDayDate(null);

  const handleAddShift = async () => {
    if (!selectedDayDate || !newName.trim()) return;
    setAddLoading(true);
    try {
      const shiftTime = newTime.length === 5 ? `${newTime}:00` : newTime;
      const res = await fetch("/api/seguridad/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guard_name: newName.trim(),
          shift_date: selectedDayDate,
          shift_time: shiftTime,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchShifts();
      setNewName("");
      // Auto-select next available time slot
      const addedTime = newTime.slice(0, 5);
      const updatedTaken = [...shifts.filter(s => s.shift_date === selectedDayDate).map(s => s.shift_time.slice(0, 5)), addedTime];
      const nextTime = !updatedTaken.includes("07:00") ? "07:00"
        : !updatedTaken.includes("15:00") ? "15:00"
        : "23:00";
      setNewTime(nextTime);
    } catch (e) {
      console.error(e);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    setDeleteLoadingId(shiftId);
    try {
      const res = await fetch(`/api/seguridad/shifts?id=${shiftId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchShifts();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getShiftInfo = (shiftTime: string) => ({
    displayTime: formatShiftTime(shiftTime),
  });

  const today = getArgentinaDate();
  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isCurrentMonthView =
    month === today.getMonth() && year === today.getFullYear();

  // Center today's row when the calendar shows the current month. Two layers:
  //
  // 1. `useLayoutEffect` runs synchronously after every commit, before paint,
  //    so the user never sees a "wrong" scroll frame — important here because
  //    `loading` flips false → rows mount → we need to grab their offsetTop and
  //    write `scrollTop` before the browser hands the user a painted frame.
  // 2. The callback-ref `setTodayRow` fires the moment React attaches the DOM
  //    node, regardless of any React reconciliation timing. This catches the
  //    case where the layout effect's deps don't change but the today row
  //    remounts (e.g., loading transitions where `shifts.length` stays 0 so
  //    the dep array doesn't notice anything changed). Without this, if no
  //    shifts existed for the current month, the deps `[loading, ...]` covered
  //    it, but in practice we still saw the list landing scrolled past today.
  //    The callback ref makes the centering happen as part of attachment.
  const centerToday = useCallback(() => {
    const list = listScrollRef.current;
    const row = todayRowRef.current;
    if (!list || !row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const rowTopInsideList = rowRect.top - listRect.top + list.scrollTop;
    const targetTop =
      rowTopInsideList - list.clientHeight / 2 + rowRect.height / 2;
    const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
    list.scrollTop = Math.min(maxScroll, Math.max(0, targetTop));
  }, []);

  const setTodayRow = useCallback(
    (node: HTMLButtonElement | null) => {
      todayRowRef.current = node;
      if (node) centerToday();
    },
    [centerToday]
  );

  useLayoutEffect(() => {
    if (loading) return;
    if (!isCurrentMonthView) return;
    centerToday();
  }, [loading, isCurrentMonthView, shifts.length, centerToday]);

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={handlePreviousMonth}
          className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleYearClick}
          className="inline-flex items-center px-3 py-1 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-xs font-bold uppercase tracking-wider hover:bg-[#2d5016]/15 transition-colors"
        >
          {monthNames[month]} {year}
        </button>
        <button
          onClick={handleNextMonth}
          className="inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-[#2d5016] hover:bg-[#2d5016]/10 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Year Selector */}
      {selectedYear !== null && (
        <div className="mb-2 p-2 bg-gray-50 rounded-[14px] border border-gray-200 max-h-32 overflow-y-auto">
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 20 }, (_, i) => selectedYear - 10 + i).map((y) => (
              <button
                key={y}
                onClick={() => handleYearSelect(y)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  y === year
                    ? "bg-[#2d5016] text-white"
                    : "bg-white hover:bg-gray-100 text-[#1a1a1a]"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day list view — wide rows so all 3 shift names stay fully readable */}
      <div className="flex-1 min-h-0 rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE]/70 overflow-hidden">
        <div
          ref={listScrollRef}
          className="overflow-y-auto h-[380px] divide-y divide-dashed divide-[#E9E2CE]"
          style={{ overflowAnchor: "none" }}
        >
          {calendarDays
            .filter((d): d is number => d !== null)
            .map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrent = isToday(day);
              const dateObj = new Date(year, month, day);
              const weekday = dayNames[dateObj.getDay()];

              // Up to 3 slots — show empty placeholders so the row layout is stable.
              const slots = [0, 1, 2].map((i) => dayShifts[i] || null);

              return (
                <button
                  key={day}
                  ref={isCurrent ? setTodayRow : undefined}
                  type="button"
                  onClick={() => openDayModal(day)}
                  className={`w-full grid grid-cols-[44px_1fr] gap-2 items-center px-2 py-1.5 text-left transition-colors hover:bg-white ${
                    isCurrent ? "bg-[#2d5016]/10" : "bg-transparent"
                  }`}
                >
                  {/* Day badge */}
                  <div
                    className={`flex flex-col items-center justify-center rounded-[14px] py-1 ${
                      isCurrent
                        ? "bg-[#2d3d2a] text-[#faf6ec]"
                        : "bg-white border border-[#E9E2CE] text-[#1a2617]"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none opacity-80">
                      {weekday}
                    </span>
                    <span className="text-base font-bold leading-none mt-0.5">{day}</span>
                  </div>

                  {/* 3 shift slots */}
                  <div className="grid grid-cols-3 gap-1">
                    {slots.map((shift, i) =>
                      shift ? (
                        <div
                          key={shift.id}
                          className="rounded-[14px] bg-[#2d3d2a] text-[#faf6ec] px-2 py-1 min-w-0"
                          title={`${shift.guard_name} ${getShiftInfo(shift.shift_time).displayTime}${shift.notes ? ` – ${shift.notes}` : ""}`}
                        >
                          <div className="text-[9px] leading-none font-mono opacity-80">
                            {getShiftInfo(shift.shift_time).displayTime}
                          </div>
                          <div className="text-[11px] leading-tight font-medium truncate mt-0.5">
                            {shift.guard_name}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={`empty-${day}-${i}`}
                          className="rounded-[14px] bg-white border border-dashed border-[#E9E2CE] px-2 py-1 text-[10px] text-[#c9b893] flex items-center justify-center"
                        >
                          —
                        </div>
                      )
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Day shifts modal */}
      {selectedDayDate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDayModal();
          }}
          className="fixed inset-0 z-[1000] grid place-items-center p-4"
          style={{ background: "rgba(26, 38, 23, 0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-md max-h-[85vh] bg-[#faf6ec] rounded-[16px] border border-[#d9d2bf] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 py-5 border-b border-dashed border-[#E9E2CE] shrink-0"
              style={{ background: "linear-gradient(180deg, #eef1ea, #faf6ec)" }}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-[14px] bg-[#2d5016]/10">
                <CalendarDays className="w-5 h-5 text-[#2d5016]" strokeWidth={1.6} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547]">
                  Calendario de turnos
                </div>
                <h3 className="text-base font-bold uppercase tracking-wide text-[#1a2617] leading-tight mt-0.5 truncate">
                  {(() => {
                    const [y, m, d] = selectedDayDate.split("-").map(Number);
                    return `${d} ${monthNames[m - 1]} ${y}`;
                  })()}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDayModal}
                className="shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-[14px] border border-[#d9d2bf] bg-white text-[#4d6547] hover:bg-[#eef1ea] transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              {/* Existing shifts */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
                  Turnos del día
                </div>
                {getShiftsForDateStr(selectedDayDate).length === 0 ? (
                  <div className="rounded-[14px] bg-white border border-[#E9E2CE] px-4 py-4 text-center">
                    <p className="text-xs text-[#4d6547]">
                      Sin turnos asignados. Agregá uno abajo.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {getShiftsForDateStr(selectedDayDate).map((shift) => (
                      <li
                        key={shift.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-[14px] bg-white border border-[#E9E2CE]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-[14px] bg-[#2d5016]/10 text-[#2d5016] text-[10px] font-mono font-semibold">
                            {formatShiftTime(shift.shift_time)}
                          </span>
                          <span className="text-sm font-medium text-[#1a2617] truncate">
                            {shift.guard_name}
                          </span>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(shift.id)}
                            disabled={deleteLoadingId === shift.id}
                            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-[14px] text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Eliminar turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add new shift */}
              {!readOnly && (
                <div className="rounded-[14px] bg-[#FBF8EF] border border-[#E9E2CE] px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#4d6547] mb-2">
                    Agregar turno
                  </div>
                  {/* min-w-0 on inputs is critical: a native <input type="time">
                      on iOS Safari has an intrinsic minimum width (clock icon
                      + AM/PM controls) that can exceed `w-full`'s grid cell
                      width and overflow the cream container. min-w-0 lets the
                      grid cell shrink the input to its column width. */}
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px] gap-2">
                    <input
                      id="new-guard-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nombre del guardia"
                      className="block w-full min-w-0 max-w-full box-border bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] placeholder-[#c9b893] focus:outline-none focus:border-[#2d5016] transition-colors"
                    />
                    <div className="min-w-0 max-w-full overflow-hidden">
                      <input
                        id="new-shift-time"
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        lang="es-AR"
                        className="block w-full min-w-0 max-w-full box-border appearance-none bg-white border border-[#E9E2CE] rounded-[14px] px-3 py-2 text-sm text-[#1a2617] focus:outline-none focus:border-[#2d5016] transition-colors font-mono"
                        style={{ WebkitAppearance: "none" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={handleAddShift}
                      disabled={!newName.trim() || addLoading}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] text-xs font-semibold transition-colors ${
                        !newName.trim() || addLoading
                          ? "bg-[#ede4d2] text-[#c9b893] cursor-not-allowed"
                          : "bg-[#2d3d2a] hover:bg-[#22301f] text-[#faf6ec]"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {addLoading ? "Agregando…" : "Añadir turno"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
