"use client";

import { useTranslations } from "next-intl";
import type { TeamOpsInsight } from "@/lib/team/types";

interface OpsInsightsStripProps {
  insights: TeamOpsInsight[];
  onFocusMember?: (memberId: string) => void;
}

export function OpsInsightsStrip({ insights, onFocusMember }: OpsInsightsStripProps) {
  const t = useTranslations("teamOps.insights");

  if (insights.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={t("title")}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("title")}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {insights.map((insight) => (
          <button
            key={insight.id}
            type="button"
            onClick={() => {
              if (insight.memberId && onFocusMember) onFocusMember(insight.memberId);
            }}
            className="min-w-[200px] shrink-0 rounded-2xl border border-subtle bg-elevated/40 px-3.5 py-3 text-start transition hover:border-accent/30 hover:bg-elevated/70"
          >
            <p className="text-[11px] font-medium text-accent">{t(`kinds.${insight.kind}`)}</p>
            <p className="mt-1 text-sm font-semibold text-primary">
              {insight.kind === "balanced_suggestion"
                ? t("balancedBody", {
                    from: insight.valueLabel,
                    to: insight.memberName ?? "",
                  })
                : insight.memberName}
            </p>
            {insight.kind !== "balanced_suggestion" ? (
              <p className="mt-0.5 text-xs text-muted">
                {t(`values.${insight.kind}`, { value: insight.valueLabel })}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
