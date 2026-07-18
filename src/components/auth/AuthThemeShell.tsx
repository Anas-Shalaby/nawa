"use client";

import { AppThemeProvider } from "@/components/theme/AppThemeProvider";

export function AuthThemeShell({ children }: { children: React.ReactNode }) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}
