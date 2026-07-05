"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BellRing, KanbanSquare, Smartphone } from "lucide-react";

const FEATURES = [
  { key: "booking", icon: Smartphone, accent: "#6C5CE7" },
  { key: "kanban", icon: KanbanSquare, accent: "#00CEC9" },
  { key: "discipline", icon: BellRing, accent: "#74B9FF" },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-12 max-w-2xl text-start"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-primary md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                key={feature.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-subtle dark:bg-surface"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${feature.accent}18`, color: feature.accent }}
                >
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-primary">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-muted">
                  {t(`${feature.key}.body`)}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
