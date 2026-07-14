"use client";

import "@/lib/demo/install-demo-fetch";
import { QueryProvider } from "./query-provider";
import { TutorialProvider } from "@/lib/tutorial/tutorial-provider";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import { TutorialPickerModal } from "@/components/tutorial/tutorial-picker-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <TutorialProvider>
        {children}
        <TutorialPickerModal />
        <TutorialOverlay />
      </TutorialProvider>
    </QueryProvider>
  );
}
