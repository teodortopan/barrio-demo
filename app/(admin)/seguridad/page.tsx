import { SeguridadPageContent } from "@/components/seguridad-page-content";
import {
  demoCurrentShift,
  demoGuardShifts,
  demoIngresantes,
  demoRecorridos,
} from "@/lib/demo/seed";

export default function SeguridadPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevDate = new Date(currentYear, currentMonth - 2, 1);
  const nextDate = new Date(currentYear, currentMonth, 1);

  const ingresantes = demoIngresantes();
  const currentShift = demoCurrentShift();
  const recorridos = demoRecorridos();
  const guardShiftsCurrent = demoGuardShifts(currentYear, currentMonth);
  const guardShiftsPrev = demoGuardShifts(prevDate.getFullYear(), prevDate.getMonth() + 1);
  const guardShiftsNext = demoGuardShifts(nextDate.getFullYear(), nextDate.getMonth() + 1);

  const allInitialShifts: Record<string, typeof guardShiftsCurrent> = {
    [`${currentYear}-${currentMonth}`]: guardShiftsCurrent,
    [`${prevDate.getFullYear()}-${prevDate.getMonth() + 1}`]: guardShiftsPrev,
    [`${nextDate.getFullYear()}-${nextDate.getMonth() + 1}`]: guardShiftsNext,
  };

  return (
    <SeguridadPageContent
      initialIngresantes={ingresantes}
      initialShift={currentShift}
      initialRecorridos={recorridos}
      initialGuardShifts={guardShiftsCurrent}
      initialShiftsMap={allInitialShifts}
      canEditIngresantes
      canEditRecorridos
      canEditCalendar
    />
  );
}
