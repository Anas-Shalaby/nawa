"use client";

import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SubscriptionPlanId } from "@/lib/subscriptions/types";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { PricingComparison } from "./PricingComparison";
import { PricingFAQ } from "./PricingFAQ";

const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4", "benefit5"] as const;

const PLANS: {
  id: SubscriptionPlanId;
  key: "free" | "paid";
  highlighted?: boolean;
}[] = [
  { id: "free_6mo", key: "free", highlighted: true },
  { id: "paid_6mo", key: "paid" },
];

export function PricingSection() {
  const t = useTranslations("landing.pricing");

  return (
    <Section id="pricing" ariaLabelledBy="landing-pricing-title">
      <SectionHeading
        id="landing-pricing-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={[
              "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-7 md:p-8",
              plan.highlighted
                ? "border-accent/40 bg-surface/90 shadow-[0_0_40px_rgba(108,92,231,0.14)]"
                : "border-subtle/80 bg-surface/70",
            ].join(" ")}
          >
            {plan.highlighted ? (
              <span className="absolute end-5 top-5 inline-flex items-center gap-1 rounded-full border border-accent-success/30 bg-accent-success/10 px-3 py-1 text-[11px] font-semibold text-accent-success">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t("recommended")}
              </span>
            ) : null}

            <span
              className={[
                "mb-4 inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold",
                plan.highlighted
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-subtle bg-elevated/50 text-muted",
              ].join(" ")}
            >
              {t(`${plan.key}.badge`)}
            </span>

            <p className="text-sm text-muted">{t(`${plan.key}.name`)}</p>
            <p className="mt-1 text-xl font-semibold text-primary">
              {t(`${plan.key}.duration`)}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-primary">
              {t(`${plan.key}.price`)}
            </p>
            <p className="mt-2 text-sm text-muted">{t(`${plan.key}.setupFee`)}</p>
            {plan.key === "free" ? (
              <p className="mt-3 inline-flex w-fit rounded-full border border-accent-success/30 bg-accent-success/10 px-3 py-1 text-xs font-semibold text-accent-success">
                {t("noCreditCard")}
              </p>
            ) : null}

            <p className="mt-5 text-sm leading-relaxed text-muted">
              {t(`${plan.key}.description`)}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" aria-hidden />
                  {t(benefit)}
                </li>
              ))}
            </ul>

            <Link
              href={`/register?plan=${plan.id}`}
              className={[
                "mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl px-6 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                plan.highlighted
                  ? "bg-accent text-white hover:brightness-110"
                  : "border border-subtle bg-base/50 text-primary hover:border-accent/30",
              ].join(" ")}
            >
              {t(`${plan.key}.cta`)}
            </Link>
          </article>
        ))}
      </div>

      <PricingComparison />
      <PricingFAQ />
    </Section>
  );
}
