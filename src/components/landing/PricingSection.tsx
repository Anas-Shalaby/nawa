"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SubscriptionPlanId } from "@/lib/subscriptions/types";

const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4", "benefit5"] as const;

const PLANS: {
  id: SubscriptionPlanId;
  key: "free" | "paid";
  highlighted?: boolean;
}[] = [
  { id: "free_6mo", key: "free", highlighted: true },
  { id: "paid_6mo", key: "paid" },
];

function PricingCard({
  planId,
  planKey,
  highlighted = false,
  delay = 0,
}: {
  planId: SubscriptionPlanId;
  planKey: "free" | "paid";
  highlighted?: boolean;
  delay?: number;
}) {
  const t = useTranslations("landing.pricing");

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-7 backdrop-blur-sm md:p-8",
        highlighted
          ? "border-accent/40 bg-surface/80 shadow-[0_0_40px_rgba(108,92,231,0.15)]"
          : "border-subtle/80 bg-surface/60",
      ].join(" ")}
    >
      <div
        className={[
          "pointer-events-none absolute inset-0 rounded-[1.75rem]",
          highlighted
            ? "bg-gradient-to-br from-accent/12 via-transparent to-accent-success/8"
            : "bg-gradient-to-br from-accent/6 via-transparent to-transparent",
        ].join(" ")}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col">
        <span
          className={[
            "mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            highlighted
              ? "border-accent-success/30 bg-accent-success/10 text-accent-success"
              : "border-accent/30 bg-accent/10 text-accent",
          ].join(" ")}
        >
          {highlighted ? <Sparkles className="h-3.5 w-3.5" aria-hidden /> : null}
          {t(`${planKey}.badge`)}
        </span>

        <div className="mb-5">
          <p className="text-sm text-muted">{t(`${planKey}.name`)}</p>
          <p className="mt-1 text-xl font-semibold">{t(`${planKey}.duration`)}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {t(`${planKey}.price`)}
          </p>
          <p className="mt-2 text-sm text-muted">{t(`${planKey}.setupFee`)}</p>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-muted">{t(`${planKey}.description`)}</p>

        <ul className="mb-8 flex-1 space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-sm text-muted">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" aria-hidden />
              {t(benefit)}
            </li>
          ))}
        </ul>

        <Link
          href={`/register?plan=${planId}`}
          className={[
            "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition",
            highlighted
              ? "bg-accent text-white shadow-[0_0_28px_rgba(108,92,231,0.3)] hover:brightness-110"
              : "border border-subtle bg-base/50 text-primary hover:border-accent/30 hover:bg-surface",
          ].join(" ")}
        >
          {t(`${planKey}.cta`)}
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}

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

        <div className="grid gap-5 lg:grid-cols-2">
          {PLANS.map((item, index) => (
            <PricingCard
              key={item.id}
              planId={item.id}
              planKey={item.key}
              highlighted={item.highlighted}
              delay={index * 0.08}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
