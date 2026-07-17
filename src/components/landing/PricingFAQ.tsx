"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

const FAQ_KEYS = [
  "whatIncluded",
  "setup",
  "locales",
  "booking",
  "whatsapp",
  "afterPlan",
] as const;

export function PricingFAQ() {
  const t = useTranslations("landing.faq");
  const [openKey, setOpenKey] = useState<string | null>(FAQ_KEYS[0]);

  return (
    <div id="faq" className="mt-14 scroll-mt-28">
      <h3 className="text-2xl font-semibold text-primary">{t("title")}</h3>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 divide-y divide-subtle/70 overflow-hidden rounded-[1.5rem] border border-subtle/80 bg-surface/60">
        {FAQ_KEYS.map((key) => {
          const open = openKey === key;
          return (
            <div key={key}>
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold text-primary transition hover:bg-elevated/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40"
                aria-expanded={open}
                onClick={() => setOpenKey(open ? null : key)}
              >
                <span>{t(`${key}.question`)}</span>
                <ChevronDown
                  className={[
                    "h-4 w-4 shrink-0 text-muted transition",
                    open ? "rotate-180" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>
              {open ? (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted">
                  {t(`${key}.answer`)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
