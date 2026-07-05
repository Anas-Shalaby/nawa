"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

export function PricingSection() {
  const t = useTranslations("landing.pricing");

  return (
    <section id="pricing" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-start"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-primary md:text-4xl">
            {t("title")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="mx-auto max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl dark:border-subtle dark:bg-elevated md:p-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-muted">{t("planName")}</p>
              <p className="text-lg font-semibold text-zinc-900 dark:text-primary">
                {t("planDuration")}
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-3 rounded-2xl bg-zinc-50 p-5 dark:bg-base/60">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500 dark:text-muted">{t("setupFeeLabel")}</p>
                <p className="text-3xl font-semibold text-zinc-900 dark:text-primary">
                  {t("setupFee")}
                </p>
              </div>
              <span className="rounded-full bg-accent-warning/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-accent-warning">
                {t("oneTime")}
              </span>
            </div>
            <div className="border-t border-zinc-200 pt-4 dark:border-subtle">
              <p className="text-sm text-zinc-500 dark:text-muted">{t("subscriptionLabel")}</p>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-primary">
                {t("subscriptionFee")}
              </p>
            </div>
          </div>

          <ul className="mb-8 space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" aria-hidden />
                {t(benefit)}
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
          >
            {t("cta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
