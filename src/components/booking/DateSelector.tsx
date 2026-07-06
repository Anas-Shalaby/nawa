"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { formatCairoWeekday, getCairoTodayKey, getUpcomingCairoDateKeys, buildCairoAppointmentIso } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";

interface DateSelectorProps {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
}

export function DateSelector({ selectedDate, onSelect }: DateSelectorProps) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const dates = getUpcomingCairoDateKeys(14);
  const todayKey = getCairoTodayKey();

  return (
    <section className="px-5 pb-4 text-start">
      <h2 className="mb-3 text-sm font-semibold text-booking-text">{t("chooseDate")}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dates.map((dateKey, index) => {
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === todayKey;

          return (
            <motion.button
              key={dateKey}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              onClick={() => onSelect(dateKey)}
              className={[
                "min-w-[88px] shrink-0 rounded-2xl border px-3 py-3 text-center transition",
                isSelected
                  ? "border-booking-accent bg-booking-accent text-white shadow-md shadow-booking-accent/25"
                  : "border-gray-200 bg-booking-surface text-booking-text hover:border-booking-accent/40",
              ].join(" ")}
            >
              <span className="block text-[11px] font-medium opacity-80">
                {isToday ? t("today") : formatCairoWeekday(dateKey, locale)}
              </span>
              <span className="mt-1 block text-sm font-semibold">
                {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Africa/Cairo",
                }).format(new Date(buildCairoAppointmentIso(dateKey, "12:00")))}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
