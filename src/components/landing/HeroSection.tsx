"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, TrendingDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { KanbanMockup } from "./KanbanMockup";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(108,92,231,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(108,92,231,0.18),_transparent_55%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {t("badge")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.5 }}
            className="mb-5 text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-900 dark:text-primary md:text-5xl"
          >
            {t("headline")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.5 }}
            className="mb-8 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-muted"
          >
            {t("subheadline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <Link
              href="/register"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110"
            >
              {t("cta")}
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </Link>
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-muted">
              <TrendingDown className="h-4 w-4 text-accent-success" aria-hidden />
              {t("proof")}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, duration: 0.55 }}
        >
          <KanbanMockup />
        </motion.div>
      </div>
    </section>
  );
}
