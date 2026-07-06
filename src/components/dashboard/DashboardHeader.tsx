"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface DashboardHeaderProps {
  clinicName: string;
  date: string;
}

function formatDisplayDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function DashboardHeader({ clinicName, date }: DashboardHeaderProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;

  return (
    <header className="text-start">
      <p className="text-xs font-medium uppercase tracking-widest text-accent/80">Nawa</p>
      <h1 className="mt-1 text-xl font-semibold text-primary sm:text-2xl">{clinicName}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
          {t("dailyQueue")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted sm:text-sm">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatDisplayDate(date, locale)}
        </span>
      </div>
    </header>
  );
}
