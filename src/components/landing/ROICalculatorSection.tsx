"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useMotionValue, animate } from "framer-motion";
import { Calculator } from "lucide-react";
import type { Locale } from "@/i18n/routing";

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function AnimatedAmount({ value, locale }: { value: number; locale: Locale }) {
  const count = useMotionValue(0);
  const [text, setText] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.45,
      ease: "easeOut",
    });
    const unsub = count.on("change", (latest) => {
      setText(formatMoney(latest, locale));
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, value, locale]);

  return <>{text}</>;
}

export function ROICalculatorSection() {
  const t = useTranslations("landing.roi");
  const locale = useLocale() as Locale;
  const [patientsPerDay, setPatientsPerDay] = useState(25);
  const [ticketPrice, setTicketPrice] = useState(400);

  const monthlySaved = useMemo(
    () => patientsPerDay * ticketPrice * 26 * 0.15,
    [patientsPerDay, ticketPrice],
  );

  return (
    <section id="roi" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-10 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="grid overflow-hidden rounded-[1.75rem] border border-subtle/70 bg-surface/60 shadow-[0_0_50px_rgba(108,92,231,0.08)] backdrop-blur-md lg:grid-cols-2"
        >
          {/* Inputs — first in DOM = right in RTL */}
          <div className="border-b border-subtle/60 p-6 md:p-8 lg:border-b-0 lg:border-e">
            <div className="mb-6 flex items-center gap-2 text-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Calculator className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-primary">{t("inputsTitle")}</p>
            </div>

            <div className="space-y-8 text-start">
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label htmlFor="roi-patients" className="text-sm font-medium text-primary">
                    {t("patientsLabel")}
                  </label>
                  <span className="rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-accent">
                    {patientsPerDay}
                  </span>
                </div>
                <input
                  id="roi-patients"
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={patientsPerDay}
                  onChange={(event) => setPatientsPerDay(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-subtle accent-accent"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                  <span>10</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label htmlFor="roi-ticket" className="text-sm font-medium text-primary">
                    {t("ticketLabel")}
                  </label>
                  <span className="rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1 text-sm font-semibold tabular-nums text-accent">
                    {formatMoney(ticketPrice, locale)} {t("currency")}
                  </span>
                </div>
                <input
                  id="roi-ticket"
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={ticketPrice}
                  onChange={(event) => setTicketPrice(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-subtle accent-accent"
                />
                <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                  <span>100</span>
                  <span>2,000</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted">{t("formulaHint")}</p>
            </div>
          </div>

          {/* Output */}
          <div className="relative flex flex-col justify-center bg-gradient-to-br from-accent/10 via-transparent to-accent-success/10 p-6 md:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,92,231,0.18),transparent_65%)]"
              aria-hidden
            />
            <div className="relative text-start">
              <p className="text-sm font-medium text-muted">{t("outputLabel")}</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-accent md:text-5xl">
                <AnimatedAmount value={monthlySaved} locale={locale} />{" "}
                <span className="text-xl font-semibold text-accent-success md:text-2xl">
                  {t("currency")}
                </span>
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
                {t("outputHint")}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
