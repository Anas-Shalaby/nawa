"use client";

import { useTranslations } from "next-intl";
import type { MissionControlMetrics } from "@/lib/dashboard/types";
import { SummaryMetric } from "./SummaryMetric";

interface MissionControlSummaryBarProps {
  metrics: MissionControlMetrics;
  canViewRevenue: boolean;
  compact?: boolean;
  onFocusWaiting?: () => void;
  onFocusRemaining?: () => void;
  onFocusDoctors?: () => void;
}

export function MissionControlSummaryBar({
  metrics,
  canViewRevenue,
  compact = false,
  onFocusWaiting,
  onFocusRemaining,
  onFocusDoctors,
}: MissionControlSummaryBarProps) {
  const t = useTranslations("dashboard.commandCenter.summary");

  if (compact) {
    return (
      <section
        aria-label={t("ariaLabel")}
        className="mb-3 rounded-2xl border border-subtle bg-surface px-3 py-2"
      >
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <SummaryMetric
            label={t("waiting")}
            value={metrics.waitingNow}
            tone={metrics.waitingNow > 0 ? "warning" : "neutral"}
            onClick={onFocusWaiting}
          />
          <SummaryMetric label={t("inSession")} value={metrics.inSession} />
          <SummaryMetric
            label={t("completed")}
            value={metrics.completed}
            tone="success"
          />
        </div>
      </section>
    );
  }

  const waitTone =
    metrics.averageWaitMinutes >= 20
      ? "danger"
      : metrics.averageWaitMinutes >= 10
        ? "warning"
        : "neutral";

  return (
    <section
      aria-label={t("ariaLabel")}
      className="sticky top-0 z-20 -mx-1 mb-3 rounded-2xl border border-subtle bg-surface/95 px-2 py-2 backdrop-blur-sm lg:px-3"
    >
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <SummaryMetric label={t("total")} value={metrics.totalToday} />
        <SummaryMetric
          label={t("waiting")}
          value={metrics.waitingNow}
          tone={metrics.waitingNow > 0 ? "warning" : "neutral"}
          onClick={onFocusWaiting}
        />
        <SummaryMetric label={t("inSession")} value={metrics.inSession} />
        <SummaryMetric label={t("completed")} value={metrics.completed} tone="success" />
        <SummaryMetric
          label={t("remaining")}
          value={metrics.remaining}
          onClick={onFocusRemaining}
        />
        <SummaryMetric
          label={t("avgWait")}
          value={t("minutesShort", { mins: metrics.averageWaitMinutes })}
          tone={waitTone}
        />
        <SummaryMetric
          label={t("doctors")}
          value={t("doctorsRatio", {
            available: metrics.doctorsAvailable,
            total: metrics.doctorsTotal,
          })}
          onClick={onFocusDoctors}
        />
        {canViewRevenue && metrics.todayRevenueEgp != null ? (
          <SummaryMetric
            label={t("revenue")}
            value={metrics.todayRevenueEgp.toLocaleString()}
            tone="success"
          />
        ) : null}
      </div>
    </section>
  );
}
