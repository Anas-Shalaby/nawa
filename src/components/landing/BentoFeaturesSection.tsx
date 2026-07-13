"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MessageCircle, Printer, Sparkles } from "lucide-react";

const BENTO_MOTION = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

function BentoShell({
  className = "",
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.article
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={BENTO_MOTION}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "group relative overflow-hidden rounded-2xl border border-subtle/70 bg-surface/50 p-6 backdrop-blur-sm",
        "transition-colors duration-500 hover:border-accent/25 hover:bg-surface/80",
        className,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      {children}
    </motion.article>
  );
}

function MiniDebtRadar() {
  const t = useTranslations("landing.bento.debt");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPaid(true), 1800);
    const loop = window.setInterval(() => {
      setPaid(false);
      window.setTimeout(() => setPaid(true), 1400);
    }, 5200);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(loop);
    };
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-subtle/70 bg-base/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-start">
          <p className="text-xs text-muted">{t("patient")}</p>
          <p className="mt-1 text-sm font-semibold text-primary">{t("patientName")}</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={paid ? "paid" : "due"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              paid
                ? "bg-accent-success/15 text-accent-success"
                : "bg-accent-danger/15 text-accent-danger",
            ].join(" ")}
          >
            {paid ? t("paid") : t("due")}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <motion.p
          animate={{ color: paid ? "#00CEC9" : "#FF6B6B" }}
          className="text-2xl font-bold tabular-nums"
        >
          {paid ? "0" : "١,٢٠٠"} {t("currency")}
        </motion.p>
        <motion.div
          animate={{
            scale: paid ? 1 : [1, 1.08, 1],
            opacity: paid ? 0.55 : 1,
          }}
          transition={{ duration: 1.2, repeat: paid ? 0 : Number.POSITIVE_INFINITY }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366]"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </motion.div>
      </div>
      <p className="mt-2 text-[11px] text-muted">{t("hint")}</p>
    </div>
  );
}

function MiniTimeEngine() {
  const t = useTranslations("landing.bento.time");
  const [fixed, setFixed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFixed(true), 1600);
    const loop = window.setInterval(() => {
      setFixed(false);
      window.setTimeout(() => setFixed(true), 1200);
    }, 5000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(loop);
    };
  }, []);

  return (
    <div className="mt-6 space-y-2 rounded-xl border border-subtle/70 bg-base/70 p-4">
      <div
        className={[
          "rounded-lg border px-3 py-2 transition",
          fixed
            ? "border-subtle/60 bg-surface/40"
            : "border-accent-danger/40 bg-accent-danger/10",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-primary">{t("slotA")}</span>
          <span className="text-muted">10:00</span>
        </div>
      </div>
      <motion.div
        animate={{
          x: fixed ? 0 : [0, 4, -4, 0],
          borderColor: fixed ? "rgba(42,42,60,0.6)" : "rgba(255,107,107,0.45)",
        }}
        className={[
          "rounded-lg border px-3 py-2",
          fixed ? "bg-accent-success/10" : "bg-accent-warning/10",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-primary">{t("slotB")}</span>
          <span className={fixed ? "text-accent-success" : "text-accent-warning"}>
            {fixed ? "10:30" : "10:00"}
          </span>
        </div>
      </motion.div>
      <p className="pt-1 text-[11px] text-muted">
        {fixed ? t("fixed") : t("conflict")}
      </p>
    </div>
  );
}

function MiniSmartInvoice() {
  const t = useTranslations("landing.bento.invoice");

  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-subtle/70 bg-base/70 p-5">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0 rgba(108,92,231,0)",
            "0 0 28px rgba(108,92,231,0.45)",
            "0 0 0 rgba(108,92,231,0)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white"
      >
        <Printer className="h-6 w-6" aria-hidden />
      </motion.div>
      <div className="mt-4 w-full max-w-[180px] rounded-lg border border-subtle/80 bg-white p-3 text-start shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-800">{t("receiptTitle")}</span>
          <Sparkles className="h-3 w-3 text-accent" aria-hidden />
        </div>
        <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100" />
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">{t("total")}</span>
          <span className="font-bold text-accent">850 {t("currency")}</span>
        </div>
      </div>
    </div>
  );
}

export function BentoFeaturesSection() {
  const t = useTranslations("landing.bento");
  const tDebt = useTranslations("landing.bento.debt");
  const tTime = useTranslations("landing.bento.time");
  const tInvoice = useTranslations("landing.bento.invoice");

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
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">{t("title")}</h2>
          <p className="mt-4 text-lg text-muted">{t("subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <BentoShell delay={0}>
            <h3 className="text-xl font-semibold">{tDebt("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tDebt("body")}</p>
            <MiniDebtRadar />
          </BentoShell>

          <BentoShell delay={0.08}>
            <h3 className="text-xl font-semibold">{tTime("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tTime("body")}</p>
            <MiniTimeEngine />
          </BentoShell>

          <BentoShell delay={0.14}>
            <h3 className="text-xl font-semibold">{tInvoice("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tInvoice("body")}</p>
            <MiniSmartInvoice />
          </BentoShell>
        </div>
      </div>
    </section>
  );
}
