"use client";

import { useTranslations } from "next-intl";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const INSIGHT_KEYS = [
  "appointments",
  "revenue",
  "waiting",
  "followups",
  "cancelled",
  "returning",
  "avgWait",
  "unread",
  "procedures",
] as const;

export function MorningInsightsSection() {
  const t = useTranslations("landing.insights");

  return (
    <Section ariaLabelledBy="landing-insights-title">
      <SectionHeading
        id="landing-insights-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <p className="mt-3 text-xs font-medium text-muted">{t("previewNote")}</p>

      <div
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="img"
        aria-label={t("ariaLabel")}
      >
        {INSIGHT_KEYS.map((key, index) => (
          <article
            key={key}
            className="rounded-2xl border border-subtle/80 bg-surface/70 p-4 transition hover:border-accent/25"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {t(`${key}.label`)}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-primary">
              {t(`${key}.value`)}
            </p>
            <p className="mt-1 text-xs text-muted">{t(`${key}.hint`)}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
