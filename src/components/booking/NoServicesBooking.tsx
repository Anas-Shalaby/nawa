"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarX2 } from "lucide-react";
import type { Tenant } from "@/lib/booking/types";

interface NoServicesBookingProps {
  tenant: Tenant;
}

export function NoServicesBooking({ tenant }: NoServicesBookingProps) {
  const t = useTranslations("booking");

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center px-5 py-12 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <CalendarX2 className="h-10 w-10 text-booking-muted" strokeWidth={1.5} aria-hidden />
      </div>
      <h1 className="mb-2 text-2xl font-semibold text-booking-text">{tenant.name}</h1>
      <p className="max-w-xs text-sm leading-relaxed text-booking-muted">
        {t("noServicesAvailable")}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-booking-text transition hover:bg-gray-50"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
