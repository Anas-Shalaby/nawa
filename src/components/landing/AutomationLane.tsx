import { getTranslations } from "next-intl/server";
import {
  Cake,
  CalendarClock,
  MessageCircle,
  RefreshCcw,
  UserX,
  Wallet,
} from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const ITEMS = [
  { key: "reminders", icon: CalendarClock },
  { key: "confirm", icon: MessageCircle },
  { key: "birthday", icon: Cake },
  { key: "followup", icon: RefreshCcw },
  { key: "noshow", icon: UserX },
  { key: "payment", icon: Wallet },
] as const;

export async function AutomationLane() {
  const t = await getTranslations("landing.automation");

  return (
    <Section ariaLabelledBy="landing-automation-title">
      <SectionHeading
        id="landing-automation-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ key, icon: Icon }) => (
          <article
            key={key}
            className="rounded-2xl border border-subtle/80 bg-surface/70 p-5 transition hover:border-accent/25"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-subtle bg-elevated/60 text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <h3 className="text-base font-semibold text-primary">{t(`${key}.title`)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${key}.body`)}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
