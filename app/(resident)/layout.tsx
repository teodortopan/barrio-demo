import { LayoutWrapper } from "@/components/layout-wrapper";
import { DEMO_ADMIN_VISIBILITY } from "@/lib/auth/admin-visibility";
import { DEMO_USER_EMAIL, DEMO_USER_NAME } from "@/lib/demo/demo-user";

export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutWrapper
      adminVisibility={DEMO_ADMIN_VISIBILITY}
      initialUserEmail={DEMO_USER_EMAIL}
      initialUserName={DEMO_USER_NAME}
    >
      {children}
    </LayoutWrapper>
  );
}
