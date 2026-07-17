"use client";

import { useTranslations } from "next-intl";
import type { MissionControlInsight } from "@/lib/dashboard/types";

interface SmartInsightsCardProps {
  insights: MissionControlInsight[];
}

export function SmartInsightsCard({ insights }: SmartInsightsCardProps) {
  const t = useTranslations("dashboard.commandCenter.insights");

  return (
    <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
      <h2 className="mb-2 text-xs font-semibold text-primary">{t("title")}</h2>
      {insights.length === 0 ? (
        <p className="text-[11px] text-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-1.5">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className={[
                "rounded-lg border px-2.5 py-2 text-[11px]",
                insight.tone === "warning"
                  ? "border-accent-warning/40 bg-accent-warning/10 text-primary"
                  : insight.tone === "success"
                    ? "border-accent-success/40 bg-accent-success/10 text-primary"
                    : "border-subtle bg-surface text-primary",
              ].join(" ")}
            >
              {insight.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
