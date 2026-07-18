"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Lock, Server, ShieldCheck } from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const STATS = [
  { key: "uptime", target: 99 },
  { key: "locales", target: 2 },
  { key: "trial", target: 6 },
  { key: "modules", target: 10 },
] as const;

const BADGES = [
  { key: "secure", icon: Lock },
  { key: "hosted", icon: Server },
  { key: "access", icon: ShieldCheck },
] as const;

export function ProductProofSection() {
  const t = useTranslations("landing.proof");
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id="proof" ariaLabelledBy="landing-proof-title">
      <SectionHeading
        id="landing-proof-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div ref={ref} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((item) => (
          <article
            key={item.key}
            className="rounded-[1.5rem] border border-subtle/80 bg-surface/70 p-5"
          >
            <p className="text-3xl font-semibold tabular-nums text-primary md:text-4xl">
              <CountUp
                value={item.target}
                active={visible}
                reduceMotion={Boolean(reduceMotion)}
                suffix={t(`${item.key}.suffix`)}
              />
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              {t(`${item.key}.label`)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t(`${item.key}.detail`)}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {(["quote1", "quote2", "quote3"] as const).map((key) => (
          <blockquote
            key={key}
            className="rounded-[1.5rem] border border-subtle/80 bg-elevated/40 p-5"
          >
            <p className="text-sm leading-relaxed text-primary">“{t(`testimonials.${key}.body`)}”</p>
            <footer className="mt-4 text-xs text-muted">
              <span className="font-semibold text-primary">
                {t(`testimonials.${key}.name`)}
              </span>
              {" · "}
              {t(`testimonials.${key}.role`)}
            </footer>
          </blockquote>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {BADGES.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="inline-flex items-center gap-2 rounded-full border border-subtle/80 bg-surface/70 px-3.5 py-2 text-xs font-medium text-muted"
          >
            <Icon className="h-3.5 w-3.5 text-accent" aria-hidden />
            {t(`badges.${key}`)}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">{t("logosNote")}</p>
    </Section>
  );
}

function CountUp({
  value,
  active,
  reduceMotion,
  suffix,
}: {
  value: number;
  active: boolean;
  reduceMotion: boolean;
  suffix: string;
}) {
  const [current, setCurrent] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setCurrent(value);
      return;
    }

    let frame = 0;
    const frames = 28;
    const id = window.setInterval(() => {
      frame += 1;
      setCurrent(Math.round((value * frame) / frames));
      if (frame >= frames) window.clearInterval(id);
    }, 28);

    return () => window.clearInterval(id);
  }, [active, reduceMotion, value]);

  return (
    <span>
      {current}
      {suffix}
    </span>
  );
}
