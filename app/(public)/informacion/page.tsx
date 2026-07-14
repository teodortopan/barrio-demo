import { InformacionPageContent } from "@/components/informacion-page-content";
import { DEMO_BIBLIOTECA, demoConsejoContacts } from "@/lib/demo/seed";

export default function InformacionPage() {
  return (
    <InformacionPageContent
      initialBibliotecaFiles={DEMO_BIBLIOTECA}
      consejoContactProfiles={demoConsejoContacts()}
    />
  );
}
