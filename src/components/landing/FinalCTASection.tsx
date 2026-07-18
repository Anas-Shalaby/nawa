import { getTranslations } from "next-intl/server";
import { Section } from "./marketing/Section";
import { LandingCTA } from "./marketing/LandingCTA";

export async function FinalCTASection() {
  const t = await getTranslations("landing.finalCta");

  return (
    <Section className="pt-8 md:pt-12" ariaLabelledBy="landing-final-cta-title">
      <div className="relative overflow-hidden rounded-[2rem] border border-subtle/80 bg-surface/80 px-6 py-16 text-center md:px-14 md:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--accent)_/_0.08),transparent_65%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <h2
            id="landing-final-cta-title"
            className="text-balance text-3xl font-semibold tracking-tight text-primary md:text-5xl md:leading-[1.1]"
          >
            {t("headline")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted md:text-lg">
            {t("subheadline")}
          </p>
          <div className="mt-9 flex justify-center">
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
