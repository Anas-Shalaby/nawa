"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  CalendarCheck,
  ClipboardPlus,
  CreditCard,
  MessageSquare,
  Stethoscope,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const STEPS = [
  { key: "book", icon: CalendarCheck },
  { key: "receive", icon: UserPlus },
  { key: "arrive", icon: UserCheck },
  { key: "consult", icon: Stethoscope },
  { key: "prescribe", icon: ClipboardPlus },
  { key: "pay", icon: CreditCard },
  { key: "followup", icon: MessageSquare },
] as const;

export function ClinicWorkflowTour() {
  const t = useTranslations("landing.tour");
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const current = STEPS[active];
  const Icon = current.icon;

  return (
    <Section id="tour" ariaLabelledBy="landing-tour-title">
      <SectionHeading
        id="landing-tour-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
          aria-label={t("scrollerLabel")}
        >
          {STEPS.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => setActive(index)}
              className={[
                "min-h-11 shrink-0 rounded-xl border px-3 py-2.5 text-start text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                index === active
                  ? "border-accent/35 bg-accent/10 text-primary"
                  : "border-subtle/80 bg-surface/60 text-muted hover:border-accent/20 hover:text-primary",
              ].join(" ")}
              aria-current={index === active ? "step" : undefined}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-accent">
                {t("step", { n: index + 1 })}
              </span>
              <span className="mt-0.5 block font-medium">{t(`${step.key}.title`)}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.article
            key={current.key}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="rounded-[1.75rem] border border-subtle/80 bg-surface/80 p-6 md:p-8"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-primary">
              {t(`${current.key}.title`)}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              {t(`${current.key}.body`)}
            </p>

            <div className="mt-8 rounded-2xl border border-dashed border-subtle bg-base/50 p-4 md:p-5">
              <JourneyMock step={current.key} t={t} />
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </Section>
  );
}

function JourneyMock({
  step,
  t,
}: {
  step: (typeof STEPS)[number]["key"];
  t: (key: string) => string;
}) {
  const frames: Record<(typeof STEPS)[number]["key"], string[]> = {
    book: [t("mock.book1"), t("mock.book2"), t("mock.book3")],
    receive: [t("mock.receive1"), t("mock.receive2"), t("mock.receive3")],
    arrive: [t("mock.arrive1"), t("mock.arrive2"), t("mock.arrive3")],
    consult: [t("mock.consult1"), t("mock.consult2"), t("mock.consult3")],
    prescribe: [t("mock.prescribe1"), t("mock.prescribe2"), t("mock.prescribe3")],
    pay: [t("mock.pay1"), t("mock.pay2"), t("mock.pay3")],
    followup: [t("mock.followup1"), t("mock.followup2"), t("mock.followup3")],
  };

  return (
    <ul className="space-y-2">
      {frames[step].map((line, index) => (
        <li
          key={line}
          className="flex items-center gap-3 rounded-xl border border-subtle/70 bg-elevated/40 px-3 py-2.5 text-sm text-primary"
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[11px] font-semibold text-accent">
            {index + 1}
          </span>
          {line}
        </li>
      ))}
    </ul>
  );
}
