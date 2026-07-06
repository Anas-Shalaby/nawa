"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="landing-hero-radial pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-6xl">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-balance text-center text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl md:leading-[1.1]"
        >
          {t("headline")}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 md:mt-14"
        >
          <HeroDashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
