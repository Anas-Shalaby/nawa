"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface DashboardHeaderProps {
  clinicName: string;
  date: string;
  appointmentCount: number;
}

function formatDisplayDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function DashboardHeader({
  clinicName,
  date,
  appointmentCount,
}: DashboardHeaderProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="text-start">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <span className="text-sm font-bold text-accent">N</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Nawa
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-primary">{clinicName}</h1>
        <p className="mt-1 text-sm text-muted">{t("dailyQueue")}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-subtle bg-surface px-4 py-2.5">
          <CalendarDays className="h-4 w-4 text-accent" aria-hidden />
          <span className="text-sm text-primary">{formatDisplayDate(date, locale)}</span>
        </div>
        <div className="rounded-xl border border-subtle bg-surface px-4 py-2.5">
          <span className="text-sm text-muted">
            {t("todayCount", { count: appointmentCount })}
          </span>
        </div>
      </div>
    </header>
  );
}
