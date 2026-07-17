import { getTranslations } from "next-intl/server";
import {
  CalendarClock,
  MessageCircle,
  Receipt,
  Layers3,
  UsersRound,
  ImageIcon,
} from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { MarketingCard } from "./marketing/MarketingCard";

const FEATURES = [
  { key: "booking", icon: CalendarClock },
  { key: "queue", icon: UsersRound },
  { key: "records", icon: Layers3 },
  { key: "payments", icon: Receipt },
  { key: "whatsapp", icon: MessageCircle },
  { key: "visual", icon: ImageIcon },
] as const;

export async function ProblemSolutionBento() {
  const t = await getTranslations("landing.features");

  return (
    <Section id="features" ariaLabelledBy="landing-features-title">
      <SectionHeading
        id="landing-features-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map(({ key, icon: Icon }) => (
          <MarketingCard key={key} className="flex h-full flex-col">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-primary">{t(`${key}.title`)}</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-muted">{t("problemLabel")}</dt>
                <dd className="mt-1 text-primary/90">{t(`${key}.problem`)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted">{t("solutionLabel")}</dt>
                <dd className="mt-1 text-primary/90">{t(`${key}.solution`)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-accent-success">{t("resultLabel")}</dt>
                <dd className="mt-1 text-primary">{t(`${key}.result`)}</dd>
              </div>
            </dl>
            <div className="mt-5 rounded-xl border border-dashed border-subtle bg-elevated/40 p-3">
              <p className="text-[11px] text-muted">{t(`${key}.illustration`)}</p>
            </div>
          </MarketingCard>
        ))}
      </div>
    </Section>
  );
}
