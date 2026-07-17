import { getTranslations } from "next-intl/server";
import { Section } from "./marketing/Section";
import { LandingCTA } from "./marketing/LandingCTA";

export async function FinalCTASection() {
  const t = await getTranslations("landing.finalCta");

  return (
    <Section className="pt-8 md:pt-12" ariaLabelledBy="landing-final-cta-title">
      <div className="relative overflow-hidden rounded-[2rem] border border-subtle/80 bg-surface/70 px-6 py-14 text-center md:px-12 md:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/8 via-transparent to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <h2
            id="landing-final-cta-title"
            className="text-balance text-3xl font-semibold tracking-tight text-primary md:text-5xl"
          >
            {t("headline")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted md:text-lg">
            {t("subheadline")}
          </p>
          <div className="mt-8 flex justify-center">
            <LandingCTA
              href="/register?plan=free_6mo"
              className="min-h-[52px] w-full text-base sm:w-auto"
            >
              {t("cta")}
            </LandingCTA>
          </div>
        </div>
      </div>
    </Section>
  );
}
