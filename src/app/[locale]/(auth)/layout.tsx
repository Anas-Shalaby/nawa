import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { AuthFormPanel } from "@/components/auth/AuthFormPanel";
import { AuthThemeShell } from "@/components/auth/AuthThemeShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthThemeShell>
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
        <AuthFormPanel>{children}</AuthFormPanel>
        <AuthBrandingPanel />
      </div>
    </AuthThemeShell>
  );
}
