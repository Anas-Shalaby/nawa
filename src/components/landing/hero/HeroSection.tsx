"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LandingCTA } from "../marketing/LandingCTA";

const ClinicProductShowcase = dynamic(
  () =>
    import("./ClinicProductShowcase").then((mod) => mod.ClinicProductShowcase),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[28rem] animate-pulse rounded-[1.75rem] border border-subtle bg-surface/60 md:h-[32rem]"
        aria-hidden
      />
    ),
  },
);

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-12 md:pb-28 md:pt-20">
      <div className="landing-hero-radial pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="text-start lg:col-span-5">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-accent md:text-sm">
            {t("badge")}
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-primary md:text-6xl md:leading-[1.05]">
            {t("headline")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {t("subheadline")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LandingCTA
              href="/register?plan=free_6mo"
              className="w-full min-h-[52px] text-base sm:w-auto"
            >
              {t("ctaPrimary")}
            </LandingCTA>
            <a
              href="#tour"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-subtle bg-surface/70 px-6 text-base font-semibold text-primary transition hover:border-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:w-auto"
            >
              {t("ctaSecondary")}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {(["chip1", "chip2", "chip3"] as const).map((key) => (
              <li
                key={key}
                className="rounded-full border border-subtle/80 bg-elevated/50 px-3 py-1.5 text-xs font-medium text-muted"
              >
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <ClinicProductShowcase />
        </div>
      </div>
    </section>
  );
}
