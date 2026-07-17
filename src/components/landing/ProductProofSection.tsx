"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const PROOF_ITEMS = [
  { key: "lifecycle", target: 7 },
  { key: "locales", target: 2 },
  { key: "plans", target: 6 },
  { key: "modules", target: 10 },
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
      { threshold: 0.35 },
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
        {PROOF_ITEMS.map((item) => (
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
