"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const STEPS = [
  "book",
  "receive",
  "arrive",
  "consult",
  "prescribe",
  "pay",
  "followup",
] as const;

export function ClinicWorkflowTour() {
  const t = useTranslations("landing.tour");
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <Section id="tour" ariaLabelledBy="landing-tour-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          id="landing-tour-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-subtle bg-surface text-primary transition hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={t("prev")}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-subtle bg-surface text-primary transition hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            aria-label={t("next")}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pe-1 ps-1"
        tabIndex={0}
        aria-label={t("scrollerLabel")}
      >
        {STEPS.map((key, index) => (
          <article
            key={key}
            className="w-[min(18rem,85vw)] shrink-0 snap-start rounded-[1.5rem] border border-subtle/80 bg-surface/80 p-5"
          >
            <p className="text-xs font-semibold text-accent">
              {t("step", { n: index + 1 })}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-primary">
              {t(`${key}.title`)}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t(`${key}.body`)}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
