"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { TimeSlot } from "@/lib/booking/types";

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  onSelect: (slot: TimeSlot) => void;
}

export function SlotPicker({ slots, selectedSlotId, onSelect }: SlotPickerProps) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;

  const today = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Cairo",
  }).format(new Date());

  return (
    <section className="px-5 text-start">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-booking-accent-light">
          <CalendarDays className="h-4 w-4 text-booking-accent" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-booking-text">{t("availableTimes")}</h2>
          <p className="text-xs text-booking-muted">{today}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isDisabled = !slot.available;

          return (
            <motion.button
              key={slot.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(slot)}
              whileTap={isDisabled ? undefined : { scale: 0.96 }}
              className={[
                "relative min-h-[52px] rounded-xl text-sm font-medium transition-colors",
                isDisabled
                  ? "cursor-not-allowed bg-gray-100 text-gray-300 line-through"
                  : isSelected
                    ? "bg-booking-accent text-white shadow-md shadow-booking-accent/25"
                    : "border border-gray-200 bg-booking-surface text-booking-text hover:border-booking-accent/40",
              ].join(" ")}
            >
              {slot.label}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
