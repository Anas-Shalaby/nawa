"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { TimeSlot } from "@/lib/booking/types";

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedSlotId: string | null;
  isLoading?: boolean;
  onSelect: (slot: TimeSlot) => void;
}

export function SlotPicker({
  slots,
  selectedSlotId,
  isLoading = false,
  onSelect,
}: SlotPickerProps) {
  const t = useTranslations("booking");

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-booking-muted">{t("loadingSlots")}</p>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-booking-surface px-4 py-10 text-center">
        <p className="text-sm text-booking-muted">{t("noSlotsDay")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" dir="rtl">
      {slots.map((slot, index) => {
        const isSelected = selectedSlotId === slot.id;
        const disabled = !slot.available;

        return (
          <motion.button
            key={slot.id}
            type="button"
            disabled={disabled}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.015, duration: 0.2 }}
            whileTap={disabled ? undefined : { scale: 0.96 }}
            onClick={() => onSelect(slot)}
            className={[
              "min-h-[44px] rounded-full text-sm font-medium transition-colors",
              disabled
                ? "cursor-not-allowed bg-gray-100 text-gray-300"
                : isSelected
                  ? "bg-booking-accent text-white shadow-md shadow-booking-accent/30"
                  : "bg-booking-surface text-booking-text ring-1 ring-gray-100 hover:ring-booking-accent/40",
            ].join(" ")}
          >
            {slot.label}
          </motion.button>
        );
      })}
    </div>
  );
}
