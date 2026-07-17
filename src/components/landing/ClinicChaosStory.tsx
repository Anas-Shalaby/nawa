import { getTranslations } from "next-intl/server";
import { Phone, FileText, Users, Clock } from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { MarketingCard } from "./marketing/MarketingCard";

const CHAOS_KEYS = [
  { key: "phones", icon: Phone },
  { key: "paper", icon: FileText },
  { key: "waiting", icon: Users },
  { key: "exhaustion", icon: Clock },
] as const;

export async function ClinicChaosStory() {
  const t = await getTranslations("landing.chaos");

  return (
    <Section ariaLabelledBy="landing-chaos-title">
      <SectionHeading
        id="landing-chaos-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CHAOS_KEYS.map(({ key, icon: Icon }) => (
          <MarketingCard key={key}>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent-danger/20 bg-accent-danger/10 text-accent-danger">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-primary">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${key}.body`)}</p>
          </MarketingCard>
        ))}
      </div>
    </Section>
  );
}
