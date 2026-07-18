"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const PRIMARY = ["appointments", "revenue", "waiting", "avgWait"] as const;
const SECONDARY = [
  "followups",
  "cancelled",
  "returning",
  "unread",
  "procedures",
  "outstanding",
] as const;

export function MorningInsightsSection() {
  const t = useTranslations("landing.insights");
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
        ref={ref}
        className="mt-8 space-y-4"
        role="img"
        aria-label={t("ariaLabel")}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {PRIMARY.map((key, index) => (
            <motion.article
              key={key}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={visible ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              className="rounded-2xl border border-subtle/80 bg-surface/80 p-5"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {t(`${key}.label`)}
              </p>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-primary">
                {t(`${key}.value`)}
              </p>
              <p className="mt-2 text-xs text-muted">{t(`${key}.hint`)}</p>
            </motion.article>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY.map((key, index) => (
            <motion.article
              key={key}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={visible ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.15 + index * 0.04, duration: 0.3 }}
              className="rounded-2xl border border-subtle/70 bg-elevated/40 px-4 py-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-muted">{t(`${key}.label`)}</p>
                <p className="text-lg font-semibold tabular-nums text-primary">
                  {t(`${key}.value`)}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-muted">{t(`${key}.hint`)}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </Section>
  );
}
