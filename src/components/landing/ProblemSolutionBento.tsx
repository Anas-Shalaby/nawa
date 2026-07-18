import { getTranslations } from "next-intl/server";
import {
  CalendarClock,
  ImageIcon,
  Layers3,
  MessageCircle,
  Receipt,
  UsersRound,
} from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { MarketingCard } from "./marketing/MarketingCard";

const FEATURES = [
  { key: "booking", icon: CalendarClock, mock: ["slot1", "slot2", "slot3", "slot4"] },
  { key: "queue", icon: UsersRound, mock: ["waiting", "in", "next"] },
  { key: "records", icon: Layers3, mock: ["visit", "rx", "files"] },
  { key: "payments", icon: Receipt, mock: ["due", "paid"] },
  { key: "whatsapp", icon: MessageCircle, mock: ["msg1", "msg2"] },
  { key: "visual", icon: ImageIcon, mock: ["before", "after"] },
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

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {FEATURES.map(({ key, icon: Icon, mock }) => (
          <MarketingCard key={key} className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-stretch">
            <div>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-primary">
                {t(`${key}.title`)}
              </h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("problemLabel")}
                  </dt>
                  <dd className="mt-1 text-primary/90">{t(`${key}.problem`)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("solutionLabel")}
                  </dt>
                  <dd className="mt-1 text-primary/90">{t(`${key}.solution`)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-accent-success">
                    {t("resultLabel")}
                  </dt>
                  <dd className="mt-1 font-medium text-primary">{t(`${key}.result`)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-subtle/80 bg-base/60 p-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {t(`${key}.illustration`)}
              </p>
              <div className="space-y-2">
                {mock.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-subtle/70 bg-elevated/50 px-3 py-2.5 text-xs text-primary"
                  >
                    {t(`${key}.mock.${item}`)}
                  </div>
                ))}
              </div>
            </div>
          </MarketingCard>
        ))}
      </div>
    </Section>
  );
}
