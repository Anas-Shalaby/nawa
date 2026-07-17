"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { PaymentTickerItem, UnpaidCollectItem } from "@/lib/dashboard/types";

interface CashAndBalancesCardProps {
  canViewRevenue: boolean;
  todayPayments: PaymentTickerItem[];
  yesterdayUnpaid: UnpaidCollectItem[];
  todayRevenueEgp?: number;
  numberLocale: string;
}

export function CashAndBalancesCard({
  canViewRevenue,
  todayPayments,
  yesterdayUnpaid,
  todayRevenueEgp,
  numberLocale,
}: CashAndBalancesCardProps) {
  const t = useTranslations("dashboard.commandCenter.radar");

  if (!canViewRevenue) {
    return (
      <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
        <h2 className="mb-2 text-xs font-semibold text-primary">{t("cashTitle")}</h2>
        <p className="px-1 py-4 text-center text-[11px] text-muted">{t("tickerHidden")}</p>
      </section>
    );
  }

  const outstanding = yesterdayUnpaid.reduce((sum, item) => sum + item.amountDue, 0);

  return (
    <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
      <h2 className="mb-2 text-xs font-semibold text-primary">{t("cashTitle")}</h2>
      <div className="mb-2 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-subtle bg-surface px-2 py-1.5">
          <p className="text-muted">{t("collectedToday")}</p>
          <p className="font-semibold tabular-nums text-accent-success">
            {(todayRevenueEgp ?? 0).toLocaleString(numberLocale)}
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-surface px-2 py-1.5">
          <p className="text-muted">{t("outstanding")}</p>
          <p className="font-semibold tabular-nums text-accent-warning">
            {outstanding.toLocaleString(numberLocale)}
          </p>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {todayPayments.length === 0 ? (
          <p className="px-1 py-4 text-center text-[11px] text-muted">{t("tickerEmpty")}</p>
        ) : (
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {todayPayments.map((payment) => (
                <motion.li
                  key={payment.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px]"
                >
                  <p className="font-semibold text-accent-success">
                    {t("tickerItem", {
                      amount: payment.amountPaid.toLocaleString(numberLocale),
                      name: payment.patientName,
                    })}
                  </p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
