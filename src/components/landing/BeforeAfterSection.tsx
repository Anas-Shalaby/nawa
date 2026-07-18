import { getTranslations } from "next-intl/server";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const BEFORE = [
  "phones",
  "paper",
  "crowd",
  "missed",
  "reminders",
  "cash",
  "stress",
] as const;

const AFTER = [
  "digital",
  "schedule",
  "autoReminders",
  "records",
  "reception",
  "smart",
  "visibility",
] as const;

export async function BeforeAfterSection() {
  const t = await getTranslations("landing.beforeAfter");

  return (
    <Section ariaLabelledBy="landing-before-after-title" className="md:py-36">
      <SectionHeading
        id="landing-before-after-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-subtle/80 lg:grid-cols-2">
        <article className="bg-elevated/40 p-7 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("beforeLabel")}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-primary md:text-3xl">
            {t("beforeTitle")}
          </h3>
          <ul className="mt-8 space-y-3">
            {BEFORE.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-xl border border-subtle/60 bg-base/40 px-4 py-3 text-sm text-muted"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-danger/70"
                  aria-hidden
                />
                {t(`before.${key}`)}
              </li>
            ))}
          </ul>
        </article>

        <article className="border-t border-subtle/80 bg-surface/90 p-7 md:p-10 lg:border-s lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {t("afterLabel")}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-primary md:text-3xl">
            {t("afterTitle")}
          </h3>
          <ul className="mt-8 space-y-3">
            {AFTER.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3 text-sm text-primary"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-success"
                  aria-hidden
                />
                {t(`after.${key}`)}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </Section>
  );
}
