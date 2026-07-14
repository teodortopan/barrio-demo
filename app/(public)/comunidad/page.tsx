import { ComunidadPageContent } from "@/components/comunidad-page-content";
import { demoCalendarEvents, demoReminders } from "@/lib/demo/seed";

export default function ComunidadPage() {
  return (
    <ComunidadPageContent
      initialNovedades={demoReminders("novedad")}
      initialCalendarEvents={demoCalendarEvents()}
      canDeleteEvents
    />
  );
}
