"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const ROWS = [
  "duration",
  "price",
  "setup",
  "booking",
  "queue",
  "records",
  "whatsapp",
  "support",
] as const;

export function PricingComparison() {
  const t = useTranslations("landing.pricing.comparison");

  return (
    <div className="mt-12 overflow-hidden rounded-[1.5rem] border border-subtle/80 bg-surface/60">
      <div className="border-b border-subtle/80 px-5 py-4">
        <h3 className="text-lg font-semibold text-primary">{t("title")}</h3>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="hidden md:block">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-subtle/70 text-muted">
              <th className="px-5 py-3 font-medium">{t("feature")}</th>
              <th className="px-5 py-3 font-medium">{t("free")}</th>
              <th className="px-5 py-3 font-medium">{t("paid")}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row} className="border-b border-subtle/50 last:border-b-0">
                <td className="px-5 py-3 text-primary">{t(`${row}.label`)}</td>
                <td className="px-5 py-3 text-muted">{t(`${row}.free`)}</td>
                <td className="px-5 py-3 text-muted">{t(`${row}.paid`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {ROWS.map((row) => (
          <div key={row} className="rounded-xl border border-subtle/70 bg-base/30 p-4">
            <p className="text-sm font-semibold text-primary">{t(`${row}.label`)}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted">{t("free")}</p>
                <p className="mt-1 text-primary">{t(`${row}.free`)}</p>
              </div>
              <div>
                <p className="text-muted">{t("paid")}</p>
                <p className="mt-1 text-primary">{t(`${row}.paid`)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="flex items-start gap-2 border-t border-subtle/70 px-5 py-4 text-xs text-muted">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-success" aria-hidden />
        {t("note")}
      </p>
    </div>
  );
}
