"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pb-32 md:pt-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(108,92,231,0.18),transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-subtle/80 bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-success" aria-hidden />
          {t("badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.55 }}
          className="text-balance text-4xl font-semibold leading-[1.12] tracking-tight md:text-6xl"
        >
          {t("headline")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted md:text-xl"
        >
          {t("subheadline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.55 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/register"
            className="inline-flex min-h-[52px] min-w-[200px] items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3 text-base font-semibold text-white shadow-[0_0_32px_rgba(108,92,231,0.35)] transition hover:brightness-110"
          >
            {t("ctaPrimary")}
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
          </Link>
          <a
            href="#features"
            className="inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-xl border border-subtle bg-surface/40 px-8 py-3 text-base font-semibold text-primary backdrop-blur-sm transition hover:border-accent/40 hover:bg-surface/70"
          >
            {t("ctaSecondary")}
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-subtle/80 bg-subtle/40"
          aria-hidden
        >
          {(["stat1", "stat2", "stat3"] as const).map((key) => (
            <div key={key} className="bg-surface/80 px-4 py-5 text-center backdrop-blur-sm">
              <p className="text-xl font-semibold text-primary md:text-2xl">{t(`${key}Value`)}</p>
              <p className="mt-1 text-xs text-muted md:text-sm">{t(`${key}Label`)}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
