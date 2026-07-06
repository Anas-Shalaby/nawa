"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChevronsLeftRight, TrendingUp } from "lucide-react";
import Image from "next/image";

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

function MiniRoiTracker() {
  const t = useTranslations("landing.bento.roi");
  const bars = [38, 52, 45, 68, 58, 82, 74, 95];

  return (
    <div className="mt-6 rounded-xl border border-accent-success/20 bg-base/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{t("metricLabel")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-accent-success md:text-3xl">
            {t("metricValue")}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-accent-success/20 bg-accent-success/10 px-2.5 py-1 text-xs font-medium text-accent-success">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          {t("metricDelta")}
        </div>
      </div>
      <div className="mt-5 flex h-16 items-end gap-1.5" aria-hidden>
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm bg-gradient-to-t from-accent-success/20 to-accent-success/70"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-muted">
        <span>{t("chartStart")}</span>
        <span>{t("chartEnd")}</span>
      </div>
    </div>
  );
}

function MiniBeforeAfter() {
  const t = useTranslations("landing.bento.visual");
  return (
    <div className="relative mt-6 h-44 overflow-hidden rounded-xl border border-subtle bg-elevated/80 md:h-52">
      <div className="absolute inset-y-0 start-0 w-1/2 bg-gradient-to-br from-subtle/50 to-base/80" />
      <div className="absolute inset-y-0 end-0 w-1/2 bg-gradient-to-bl from-accent-success/15 to-elevated" />
      <div className="absolute inset-y-3 start-1/2 w-px -translate-x-1/2 bg-accent shadow-[0_0_16px_rgba(108,92,231,0.55)]" />
      <div className="absolute start-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/60 bg-surface shadow-lg">
        <ChevronsLeftRight className="h-4 w-4 text-accent" aria-hidden />
      </div>
      <span className="absolute bottom-3 start-3 rounded-md bg-base/80 px-2 py-0.5 text-[10px] font-medium text-muted">
        {t("before")}
      </span>
      <span className="absolute bottom-3 end-3 rounded-md bg-base/80 px-2 py-0.5 text-[10px] font-medium text-accent-success">
        {t("after")}
      </span>
      <div className="absolute top-3 start-3 end-3 flex gap-1" aria-hidden>
        <span className="h-1.5 flex-1 rounded-full bg-subtle/80" />
        <span className="h-1.5 w-8 rounded-full bg-accent/40" />
      </div>
    </div>
  );
}

function MiniMasterDetailQueue() {
  const t = useTranslations("landing.bento.queue");
  const rows = [
    {
      name: t("patient1"),
      time: "10:30",
      active: true,
      status: t("statusInSession"),
    },
    {
      name: t("patient2"),
      time: "11:00",
      active: false,
      status: t("statusConfirmed"),
    },
    {
      name: t("patient3"),
      time: "11:30",
      active: false,
      status: t("statusCheckedIn"),
    },
  ];

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-5">
      <div className="space-y-2 rounded-xl border border-subtle/80 bg-base/60 p-3 md:col-span-2">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted">
          {t("queueLabel")}
        </p>
        {rows.map((row) => (
          <div
            key={row.name}
            className={[
              "rounded-lg border px-2.5 py-2 transition-colors",
              row.active
                ? "border-accent/40 bg-accent/10"
                : "border-subtle/60 bg-surface/40",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs font-medium text-primary">
                {row.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted">
                {row.time}
              </span>
            </div>
            <span
              className={[
                "mt-1 inline-block text-[10px]",
                row.active ? "text-accent" : "text-muted",
              ].join(" ")}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-accent/25 bg-elevated/60 p-3 md:col-span-3">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-accent">
          {t("detailLabel")}
        </p>
        <div className="mb-3 h-2.5 w-2/3 rounded-full bg-subtle/80" />
        <div className="mb-2 h-2 w-full rounded-full bg-subtle/50" />
        <div className="mb-4 h-2 w-4/5 rounded-full bg-subtle/40" />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-subtle/60 bg-base/50 p-2">
            <p className="text-[10px] text-muted">{t("detailService")}</p>
            <p className="mt-1 text-xs font-medium">
              {t("detailServiceValue")}
            </p>
          </div>
          <div className="rounded-lg border border-subtle/60 bg-base/50 p-2">
            <p className="text-[10px] text-muted">{t("detailBalance")}</p>
            <p className="mt-1 text-xs font-medium text-accent-warning">
              {t("detailBalanceValue")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-medium text-white">
            {t("actionPrimary")}
          </span>
          <span className="rounded-md border border-subtle px-2.5 py-1 text-[10px] text-muted">
            {t("actionSecondary")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function BentoFeaturesSection() {
  const t = useTranslations("landing.bento");
  const tRoi = useTranslations("landing.bento.roi");
  const tWhatsapp = useTranslations("landing.bento.whatsapp");
  const tVisual = useTranslations("landing.bento.visual");
  const tQueue = useTranslations("landing.bento.queue");

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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-min">
          <BentoShell className="md:col-span-2" delay={0}>
            <h3 className="text-xl font-semibold">{tRoi("title")}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {tRoi("body")}
            </p>
            <MiniRoiTracker />
          </BentoShell>

          <BentoShell delay={0.06}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#25D366]/30 bg-[#25D366]/10">
              <Image
                src="/icons/whatsapp.svg"
                alt=""
                className="h-6 w-6"
                width={24}
                height={24}
              />
            </div>
            <h3 className="mt-4 text-xl font-semibold">{tWhatsapp("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {tWhatsapp("body")}
            </p>
            <div className="mt-6 space-y-2 rounded-xl border border-subtle/70 bg-base/50 p-3">
              {[tWhatsapp("msg1"), tWhatsapp("msg2")].map((msg) => (
                <div
                  key={msg}
                  className="rounded-lg rounded-se-sm bg-[#25D366]/10 px-3 py-2 text-xs text-primary"
                >
                  {msg}
                </div>
              ))}
              <p className="pt-1 text-center text-[10px] font-medium text-accent-success">
                {tWhatsapp("zeroCost")}
              </p>
            </div>
          </BentoShell>

          <BentoShell className="md:row-span-2" delay={0.1}>
            <h3 className="text-xl font-semibold">{tVisual("title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {tVisual("body")}
            </p>
            <MiniBeforeAfter />
            <ul className="mt-4 space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
                {tVisual("point1")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden />
                {tVisual("point2")}
              </li>
            </ul>
          </BentoShell>

          <BentoShell className="md:col-span-2" delay={0.14}>
            <h3 className="text-xl font-semibold">{tQueue("title")}</h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
              {tQueue("body")}
            </p>
            <MiniMasterDetailQueue />
          </BentoShell>
        </div>
      </div>
    </section>
  );
}
