"use client";

import { useTranslations } from "next-intl";
import type { TeamScheduleSlot } from "@/lib/team/types";

interface DaySchedulePreviewProps {
  slots: TeamScheduleSlot[];
}

export function DaySchedulePreview({ slots }: DaySchedulePreviewProps) {
  const t = useTranslations("teamOps.schedule");

  if (slots.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-subtle bg-elevated/40 px-3 py-4 text-center text-xs text-muted">
        {t("empty")}
      </p>
    );
  }

  return (
    <ol className="space-y-2 border-s border-subtle ps-3">
      {slots.map((slot) => (
        <li key={slot.id} className="relative text-start">
          <span
            className="absolute -start-[17px] top-1.5 h-2 w-2 rounded-full bg-accent"
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-2">
            <time className="shrink-0 text-xs font-semibold tabular-nums text-accent">
              {slot.timeLabel}
            </time>
            <span className="truncate text-[11px] text-muted">{t(`status.${slot.status}`)}</span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-primary">{slot.patientName}</p>
          <p className="text-xs text-muted">{slot.serviceName}</p>
        </li>
      ))}
    </ol>
  );
}
