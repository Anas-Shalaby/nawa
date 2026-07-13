"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Wallet } from "lucide-react";

const PAINS = [
  {
    key: "revenue" as const,
    icon: AlertTriangle,
  },
  {
    key: "debt" as const,
    icon: Wallet,
  },
  {
    key: "chaos" as const,
    icon: Clock,
  },
] as const;

export function ProblemAgitationSection() {
  const t = useTranslations("landing.pain");

  return (
    <section className="border-y border-subtle/50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-10 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent-danger">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {PAINS.map((pain, index) => {
            const Icon = pain.icon;
            return (
              <motion.article
                key={pain.key}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="rounded-2xl border border-accent-danger/20 bg-accent-danger/5 p-6 text-start"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-accent-danger/25 bg-accent-danger/10">
                  <Icon className="h-5 w-5 text-accent-danger" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-primary">
                  {t(`${pain.key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t(`${pain.key}.body`)}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="mt-8 text-center text-sm font-medium text-accent md:text-base"
        >
          {t("closing")}
        </motion.p>
      </div>
    </section>
  );
}
