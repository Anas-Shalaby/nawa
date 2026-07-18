import { getTranslations } from "next-intl/server";
import { Clock3, HeartHandshake, LayoutDashboard, Sparkles } from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { MarketingCard } from "./marketing/MarketingCard";

const WHY = [
  { key: "admin", icon: Sparkles },
  { key: "wait", icon: Clock3 },
  { key: "retention", icon: HeartHandshake },
  { key: "organization", icon: LayoutDashboard },
] as const;

export async function WhyClinicsChooseSection() {
  const t = await getTranslations("landing.why");

  return (
    <Section id="value" ariaLabelledBy="landing-why-title">
      <SectionHeading
        id="landing-why-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {WHY.map(({ key, icon: Icon }) => (
          <MarketingCard key={key} className="group transition hover:border-accent/25">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-subtle bg-elevated/60 text-accent transition group-hover:border-accent/30">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-primary">
              {t(`${key}.title`)}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t(`${key}.body`)}
            </p>
          </MarketingCard>
        ))}
      </div>
    </Section>
  );
}
