"use client";

import { useTranslations } from "next-intl";

interface CapacityHealthCardProps {
  capacityPct: number;
  remainingLoadMinutes: number;
}

export function CapacityHealthCard({
  capacityPct,
  remainingLoadMinutes,
}: CapacityHealthCardProps) {
  const t = useTranslations("dashboard.commandCenter.radar");
  const clamped = Math.max(0, Math.min(100, capacityPct));
  const radius = 42;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const healthTone =
    clamped >= 85 ? "text-accent-danger" : clamped >= 60 ? "text-accent-warning" : "text-accent";

  return (
    <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
      <h2 className="mb-3 text-xs font-semibold text-primary">{t("capacityTitle")}</h2>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 58" className="h-16 w-32" aria-hidden>
          <path
            d="M8 50 A42 42 0 0 1 92 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className="text-subtle"
          />
          <path
            d="M8 50 A42 42 0 0 1 92 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${healthTone} transition-[stroke-dashoffset] duration-700`}
          />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            className={`fill-current text-[16px] font-bold ${healthTone}`}
          >
            {clamped}%
          </text>
        </svg>
        <p className="mt-1 text-center text-[11px] text-muted">
          {t("capacityLabel", { pct: clamped })}
        </p>
        <p className="mt-1 text-center text-[10px] text-muted">
          {t("remainingLoad", { mins: remainingLoadMinutes })}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div
            className={`h-full rounded-full transition-all duration-700 ${healthTone.replace("text-", "bg-")}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </section>
  );
}
