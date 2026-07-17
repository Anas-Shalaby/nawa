import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const OUTCOMES = [
  "reception",
  "waiting",
  "followups",
  "records",
  "status",
  "efficiency",
] as const;

export async function DoctorOutcomesSection() {
  const t = await getTranslations("landing.outcomes");

  return (
    <Section id="value" ariaLabelledBy="landing-outcomes-title">
      <SectionHeading
        id="landing-outcomes-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {OUTCOMES.map((key) => (
          <li
            key={key}
            className="flex items-start gap-3 rounded-2xl border border-subtle/80 bg-surface/70 px-4 py-4"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-success/15 text-accent-success">
              <Check className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-sm font-medium leading-relaxed text-primary ">
              {t(key)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
