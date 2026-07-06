"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { formatCairoWeekday } from "@/lib/datetime/cairo";
import type { TimeSlot } from "@/lib/booking/types";

interface SlotPickerProps {
  selectedDate: string;
  slots: TimeSlot[];
  selectedSlotId: string | null;
  isLoading?: boolean;
  onSelect: (slot: TimeSlot) => void;
}

export function SlotPicker({
  selectedDate,
  slots,
  selectedSlotId,
  isLoading = false,
  onSelect,
}: SlotPickerProps) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;

  return (
    <section className="px-5 text-start">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5">
          <Clock3 className="h-4 w-4 text-booking-accent" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-booking-text">{t("availableTimes")}</h2>
          <p className="text-xs text-booking-muted">{formatCairoWeekday(selectedDate, locale)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-booking-muted">{t("loadingSlots")}</p>
      ) : slots.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-booking-surface px-4 py-10 text-center">
          <p className="text-sm text-booking-muted">{t("noSlotsDay")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {slots.map((slot, index) => {
            const isSelected = selectedSlotId === slot.id;

            return (
              <motion.button
                key={slot.id}
                type="button"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.25 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelect(slot)}
                className={[
                  "min-h-[48px] rounded-full text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "bg-slate-800 text-slate-100 hover:bg-blue-600",
                ].join(" ")}
              >
                {slot.label}
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
