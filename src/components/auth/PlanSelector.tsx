"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import {
  formatPlanPrice,
  getPlanDescription,
  getPlanLabel,
} from "@/lib/subscriptions/mapPlan";
import type { SubscriptionPlan, SubscriptionPlanId } from "@/lib/subscriptions/types";

interface PlanSelectorProps {
  plans: SubscriptionPlan[];
  locale: string;
  value: SubscriptionPlanId;
  onChange: (planId: SubscriptionPlanId) => void;
  error?: string;
}

export function PlanSelector({ plans, locale, value, onChange, error }: PlanSelectorProps) {
  const t = useTranslations("auth.register.plans");

  return (
    <div>
      <div className="mb-3 text-start">
        <p className="text-sm font-medium text-primary">{t("title")}</p>
        <p className="mt-1 text-xs text-muted">{t("subtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => {
          const selected = value === plan.id;
          const isFree = plan.id === "free_6mo";

          return (
            <motion.button
              key={plan.id}
              type="button"
              onClick={() => onChange(plan.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={[
                "relative rounded-2xl border p-4 text-start transition-shadow",
                selected
                  ? "border-accent/50 bg-accent/10 shadow-[0_0_24px_rgba(108,92,231,0.18)]"
                  : "border-subtle bg-surface/60 hover:border-subtle hover:bg-elevated/80",
              ].join(" ")}
            >
              {isFree ? (
                <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-accent-success/30 bg-accent-success/10 px-2.5 py-1 text-[10px] font-semibold text-accent-success">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {t("freeBadge")}
                </span>
              ) : null}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary">{getPlanLabel(plan, locale)}</p>
                  {getPlanDescription(plan, locale) ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {getPlanDescription(plan, locale)}
                    </p>
                  ) : null}
                </div>
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-accent bg-accent text-white"
                      : "border-subtle bg-transparent text-transparent",
                  ].join(" ")}
                  aria-hidden
                >
                  <Check className="h-3 w-3" />
                </span>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-lg font-semibold tracking-tight text-primary">
                  {formatPlanPrice(plan, locale)}
                </p>
                {plan.setupFeeEgp > 0 ? (
                  <p className="text-xs text-muted">
                    {t("setupFee", {
                      amount: plan.setupFeeEgp.toLocaleString(locale === "ar" ? "ar-EG" : "en-US"),
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-accent-success">{t("noSetupFee")}</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-accent-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
