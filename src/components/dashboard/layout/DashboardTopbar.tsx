"use client";

import { Menu } from "lucide-react";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { BlockTimeModal } from "@/components/dashboard/BlockTimeModal";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

interface DashboardTopbarProps {
  clinicName: string;
  tenantId: string;
  onOpenMobileMenu: () => void;
}

export function DashboardTopbar({
  clinicName,
  tenantId,
  onOpenMobileMenu,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-subtle bg-base/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-xl border border-subtle p-2 text-muted transition hover:bg-surface hover:text-primary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-start">
          <p className="text-sm font-semibold text-primary">{clinicName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationCenter />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
