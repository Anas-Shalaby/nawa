"use client";

import { CalendarPlus, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGlobalBookingDrawer } from "@/components/booking/GlobalBookingDrawerContext";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";

interface DashboardTopbarProps {
  clinicName: string;
  tenantId: string;
  onOpenMobileMenu: () => void;
}

export function DashboardTopbar({
  clinicName,
  tenantId: _tenantId,
  onOpenMobileMenu,
}: DashboardTopbarProps) {
  const t = useTranslations("dashboard.internalBooking");
  const { openBookingDrawer } = useGlobalBookingDrawer();

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
        <button
          type="button"
          onClick={() => openBookingDrawer()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white shadow-sm shadow-accent/20 transition hover:brightness-110 sm:px-4 sm:text-sm"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t("trigger")}</span>
          <span className="sm:hidden" aria-hidden>
            +
          </span>
        </button>
        <NotificationCenter />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
