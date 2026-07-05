"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

export function AuthBrandingPanel() {
  const t = useTranslations("auth.branding");

  return (
    <aside
      className={[
        "relative order-2 flex min-h-[280px] flex-col justify-between overflow-hidden p-8 md:order-1 md:min-h-screen md:p-10 lg:p-14",
        "rtl:md:order-2",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-accent/25 via-base to-[#0c1222]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(108,92,231,0.08) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(108,92,231,0.08) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <div
        className="absolute -end-24 top-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -start-16 bottom-1/4 h-56 w-56 rounded-full bg-accent-success/10 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute start-1/2 top-1/2 h-px w-[min(80%,420px)] -translate-x-1/2 -translate-y-1/2 rotate-[-24deg] bg-gradient-to-r from-transparent via-accent/40 to-transparent"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="relative"
      >
        <p className="text-sm font-medium tracking-[0.18em] text-accent/80 uppercase">
          {t("eyebrow")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.18 }}
        className="relative my-10 max-w-lg text-start md:my-0"
      >
        <h2 className="text-balance text-3xl font-semibold leading-tight text-primary lg:text-4xl">
          {t("headline")}
        </h2>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted lg:text-lg">
          {t("subheadline")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.28 }}
        className={[
          "relative max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl",
          "shadow-[0_24px_64px_rgba(0,0,0,0.35)]",
        ].join(" ")}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-success/15">
            <TrendingUp className="h-4 w-4 text-accent-success" aria-hidden />
          </div>
          <p className="text-xs font-medium text-muted">{t("proofLabel")}</p>
        </div>
        <p className="text-3xl font-semibold tracking-tight text-primary">{t("proofValue")}</p>
        <p className="mt-2 text-sm text-muted">{t("proofCaption")}</p>
      </motion.div>
    </aside>
  );
}
