"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  buildCairoAppointmentIso,
  formatCairoWeekday,
  getCairoTodayKey,
  getUpcomingCairoDateKeys,
} from "@/lib/datetime/cairo";
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
    <div className="text-start" dir="rtl">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dates.map((dateKey, index) => {
          const isSelected = selectedDate === dateKey;
          const isToday = dateKey === todayKey;
          const dayNumber = new Intl.DateTimeFormat(
            locale === "ar" ? "ar-EG" : "en-EG",
            {
              day: "numeric",
              timeZone: "Africa/Cairo",
            },
          ).format(new Date(buildCairoAppointmentIso(dateKey, "12:00")));

          return (
            <motion.button
              key={dateKey}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.25 }}
              onClick={() => onSelect(dateKey)}
              className={[
                "min-w-[72px] shrink-0 rounded-2xl px-3 py-3 text-center transition",
                isSelected
                  ? "bg-booking-accent text-white shadow-md shadow-booking-accent/30"
                  : "bg-booking-surface text-booking-muted",
              ].join(" ")}
            >
              <span className="block text-[11px] font-medium">
                {isToday ? t("today") : formatCairoWeekday(dateKey, locale)}
              </span>
              <span
                className={[
                  "mt-1 block text-lg font-bold",
                  isSelected ? "text-white" : "text-booking-text",
                ].join(" ")}
              >
                {dayNumber}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
