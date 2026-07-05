"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Banknote, Sparkles, TrendingUp } from "lucide-react";
import type { FinancialOverview } from "@/lib/dashboard/analyticsTypes";
import type { Locale } from "@/i18n/routing";

interface FinancialsShellProps {
  overview: FinancialOverview;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function FinancialsShell({ overview }: FinancialsShellProps) {
  const t = useTranslations("financials");
  const locale = useLocale() as Locale;
  const [overviewState] = useState(overview);

  const cards = useMemo(
    () => [
      {
        key: "daily",
        label: t("dailyRevenue"),
        value: formatMoney(overviewState.dailyRevenueEgp, locale),
        suffix: t("currency"),
        color: "#55EFC4",
        icon: TrendingUp,
        highlight: false,
      },
      {
        key: "monthly",
        label: t("monthlyRevenue"),
        value: formatMoney(overviewState.monthlyRevenueEgp, locale),
        suffix: t("currency"),
        color: "#74B9FF",
        icon: Banknote,
        highlight: false,
      },
      {
        key: "saved",
        label: t("nawaSavedRevenue"),
        value: formatMoney(overviewState.nawaSavedRevenueEgp, locale),
        suffix: t("currency"),
        color: "#6C5CE7",
        icon: Sparkles,
        highlight: true,
      },
    ],
    [overviewState, locale, t],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-start">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <Banknote className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Nawa
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={[
                "rounded-2xl border p-5 text-start",
                card.highlight
                  ? "border-accent/30 bg-gradient-to-br from-accent/15 via-surface to-base shadow-[0_20px_50px_rgba(108,92,231,0.12)]"
                  : "border-subtle bg-surface/80",
              ].join(" ")}
            >
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${card.color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color: card.color }} aria-hidden />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </span>
              </div>
              <p className="text-3xl font-semibold tabular-nums text-primary">
                {card.value}
                <span className="ms-1 text-sm font-normal text-muted">{card.suffix}</span>
              </p>
              {card.highlight && (
                <p className="mt-3 text-xs leading-relaxed text-muted">{t("nawaSavedHint")}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-subtle bg-surface/80">
        <header className="border-b border-subtle px-5 py-4 text-start">
          <h2 className="text-sm font-semibold text-primary">{t("recentTransactions")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("recentHint")}</p>
        </header>

        {overviewState.recentTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">{t("empty")}</div>
        ) : (
          <ul className="divide-y divide-subtle">
            {overviewState.recentTransactions.map((tx, index) => (
              <motion.li
                key={tx.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-start">
                  <p className="font-medium text-primary">{tx.patientName}</p>
                  <p className="mt-0.5 text-sm text-muted">{tx.serviceName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(tx.appointmentDate, locale)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {tx.isBackfill && (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                      {t("backfillBadge")}
                    </span>
                  )}
                  <p className="text-lg font-semibold tabular-nums text-primary">
                    {formatMoney(tx.priceEgp, locale)}
                    <span className="ms-1 text-xs font-normal text-muted">{t("currency")}</span>
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
