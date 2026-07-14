"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ProfileModal } from "@/components/profile-modal";
import type { AdminVisibility } from "@/lib/auth/admin-visibility";

export function LayoutWrapper({
  children,
  adminVisibility,
  initialUserEmail,
  initialUserName,
}: {
  children: React.ReactNode;
  adminVisibility?: AdminVisibility;
  initialUserEmail?: string | null;
  initialUserName?: string | null;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/" ||
    pathname === "/signup" ||
    pathname === "/pending" ||
    pathname === "/reset-password";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="sj-app">
      <Sidebar
        adminVisibility={adminVisibility}
        initialUserEmail={initialUserEmail}
        initialUserName={initialUserName}
      />
      <div className="sj-main">
        <Topbar
          userName={initialUserName}
          userEmail={initialUserEmail}
          adminVisibility={adminVisibility}
        />
        {children}
      </div>
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNav adminVisibility={adminVisibility} />
      </div>
      {initialUserEmail ? <ProfileModal /> : null}
    </div>
  );
}
