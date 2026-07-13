"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="landing-hero-radial pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-6xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 text-xs font-semibold tracking-[0.22em] text-accent md:text-sm"
        >
          {t("badge")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-balance bg-gradient-to-l from-accent via-[#8B7CF7] to-accent-success bg-clip-text text-4xl font-bold leading-[1.15] text-transparent md:text-6xl md:leading-[1.08]"
        >
          {t("headline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
        >
          {t("subheadline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register?plan=free_6mo"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_32px_rgba(108,92,231,0.35)] transition hover:brightness-110 sm:w-auto"
          >
            {t("ctaPrimary")}
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
          </Link>
          <a
            href="#features"
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-subtle bg-surface/50 px-7 py-3.5 text-base font-semibold text-primary backdrop-blur-sm transition hover:border-accent/40 hover:bg-surface sm:w-auto"
          >
            {t("ctaSecondary")}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 md:mt-16"
        >
          <HeroDashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
