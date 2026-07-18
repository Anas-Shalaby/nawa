"use client";

import { useTranslations } from "next-intl";
import type { WorkloadHeat } from "@/lib/team/types";

const HEAT_FILL: Record<WorkloadHeat, string> = {
  low: "bg-accent-success",
  medium: "bg-status-checkedIn",
  high: "bg-accent-warning",
  critical: "bg-accent-danger",
};

interface WorkloadMeterProps {
  pct: number;
  heat: WorkloadHeat;
  bookedMinutes: number;
  capacityMinutes: number;
}

export function WorkloadMeter({
  pct,
  heat,
  bookedMinutes,
  capacityMinutes,
}: WorkloadMeterProps) {
  const t = useTranslations("teamOps.workload");
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-muted">{t("label")}</span>
        <span className="font-semibold text-primary">
          {t("heat", { heat: t(`levels.${heat}`), pct: clamped })}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-subtle/80"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("label")}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${HEAT_FILL[heat]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-[10px] text-muted">
        {t("minutes", { booked: bookedMinutes, capacity: capacityMinutes })}
      </p>
    </div>
  );
}
