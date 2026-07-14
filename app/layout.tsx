import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { DemoModeChrome } from "@/components/demo/demo-mode-chrome";

export const metadata: Metadata = {
  title: "Barrio Demo",
  description: "Demostración estática de una plataforma de gestión barrial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <DemoModeChrome />
      </body>
    </html>
  );
}
