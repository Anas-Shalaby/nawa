"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";

const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4", "benefit5"] as const;

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
          className="mb-10 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-xl overflow-hidden rounded-[1.75rem] border border-subtle/80 bg-surface/60 p-8 backdrop-blur-sm md:p-10"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-accent/10 via-transparent to-accent-success/5"
            aria-hidden
          />

          <div className="relative">
            <div className="mb-2 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              {t("hook")}
            </div>

            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">{t("planName")}</p>
                <p className="text-xl font-semibold">{t("planDuration")}</p>
              </div>
              <div className="text-end">
                <p className="text-xs text-muted">{t("onboardingLabel")}</p>
                <p className="text-sm font-medium text-primary">{t("onboardingValue")}</p>
              </div>
            </div>

            <div className="mb-6 space-y-4 rounded-2xl border border-subtle/60 bg-base/50 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">{t("setupFeeLabel")}</p>
                  <p className="text-3xl font-semibold tracking-tight">{t("setupFee")}</p>
                </div>
                <span className="rounded-full border border-accent-warning/30 bg-accent-warning/10 px-3 py-1 text-xs font-medium text-accent-warning">
                  {t("oneTime")}
                </span>
              </div>
              <div className="border-t border-subtle/80 pt-4">
                <p className="text-sm text-muted">{t("subscriptionLabel")}</p>
                <p className="text-3xl font-semibold tracking-tight">{t("subscriptionFee")}</p>
              </div>
            </div>

            <ul className="mb-8 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" aria-hidden />
                  {t(benefit)}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white shadow-[0_0_28px_rgba(108,92,231,0.3)] transition hover:brightness-110"
            >
              {t("cta")}
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
