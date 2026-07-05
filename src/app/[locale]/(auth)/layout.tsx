import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { AuthFormPanel } from "@/components/auth/AuthFormPanel";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <AuthFormPanel>{children}</AuthFormPanel>
        <AuthBrandingPanel />
      </div>
    </div>
  );
}
