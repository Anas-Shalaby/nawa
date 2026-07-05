"use client";

import { usePathname } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function GlobalLocaleSwitcher() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isLanding = pathname === "/";
  const isAuth = pathname === "/login" || pathname === "/register";

  if (isDashboard || isLanding || isAuth) {
    return null;
  }

  return (
    <div className="fixed end-4 top-4 z-[100]">
      <LocaleSwitcher />
    </div>
  );
}
