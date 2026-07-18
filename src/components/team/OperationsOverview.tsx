"use client";

import { useTranslations } from "next-intl";
import type { OverviewFilterKey, TeamOverviewCounts } from "@/lib/team/types";

interface OverviewCardDef {
  key: OverviewFilterKey;
  value: number | string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
}

interface OperationsOverviewProps {
  overview: TeamOverviewCounts;
  active: OverviewFilterKey;
  onSelect: (key: OverviewFilterKey) => void;
}

const TONE_CLASS = {
  default: "hover:border-accent/30",
  success: "hover:border-accent-success/40",
  warning: "hover:border-accent-warning/40",
  danger: "hover:border-accent-danger/40",
  accent: "hover:border-accent/40",
} as const;

export function OperationsOverview({ overview, active, onSelect }: OperationsOverviewProps) {
  const t = useTranslations("teamOps.overview");

  const cards: OverviewCardDef[] = [
    { key: "all", value: overview.totalStaff },
    { key: "doctors", value: overview.doctorsOnDuty, tone: "accent" },
    { key: "reception", value: overview.receptionActive },
    { key: "available", value: overview.availableNow, tone: "success" },
    { key: "busy", value: overview.busyNow, tone: "warning" },
    { key: "on_leave", value: overview.onLeave },
    { key: "offline", value: overview.offline },
    {
      key: "workload",
      value: `${overview.averageWorkloadPct}%`,
      tone: overview.averageWorkloadPct >= 90 ? "danger" : "default",
    },
  ];

  return (
    <section aria-label={t("label")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {cards.map((card) => {
          const selected = active === card.key;
          const tone = card.tone ?? "default";
          const labelKey =
            card.key === "workload"
              ? "averageWorkload"
              : card.key === "all"
                ? "totalStaff"
                : card.key === "doctors"
                  ? "doctorsOnDuty"
                  : card.key === "reception"
                    ? "receptionActive"
                    : card.key === "available"
                      ? "availableNow"
                      : card.key === "busy"
                        ? "busyNow"
                        : card.key === "on_leave"
                          ? "onLeave"
                          : "offline";

          return (
            <button
              key={card.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(card.key === active ? "all" : card.key)}
              className={[
                "rounded-2xl border bg-surface/70 px-3 py-3 text-start transition",
                TONE_CLASS[tone],
                selected
                  ? "border-accent/50 bg-accent/10 ring-1 ring-accent/20"
                  : "border-subtle",
              ].join(" ")}
            >
              <p className="text-xl font-semibold tabular-nums tracking-tight text-primary">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted">{t(labelKey)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
