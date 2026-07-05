"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CalendarClock, RefreshCw, Wallet } from "lucide-react";

const PILLARS = [
  { key: "careLoop", icon: RefreshCw, accent: "text-accent" },
  { key: "installments", icon: Wallet, accent: "text-accent-warning" },
  { key: "agenda", icon: CalendarClock, accent: "text-accent-success" },
] as const;

export function ValuePropositionSection() {
  const t = useTranslations("landing.value");

  return (
    <section id="value" className="border-y border-subtle/60 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-12 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">{t("eyebrow")}</p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <motion.article
                key={pillar.key}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-subtle/70 bg-surface/40 p-6 backdrop-blur-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-subtle/80 bg-base/60">
                  <Icon className={`h-5 w-5 ${pillar.accent}`} strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold">{t(`${pillar.key}.title`)}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(`${pillar.key}.body`)}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
