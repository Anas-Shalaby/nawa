import { getTranslations } from "next-intl/server";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

export async function BeforeAfterSection() {
  const t = await getTranslations("landing.beforeAfter");

  const beforeItems = ["phones", "paper", "crowd", "missed", "confused"] as const;
  const afterItems = ["schedule", "reminders", "records", "flow", "focus"] as const;

  return (
    <Section ariaLabelledBy="landing-before-after-title">
      <SectionHeading
        id="landing-before-after-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className="rounded-[1.75rem] border border-accent-danger/25 bg-accent-danger/[0.04] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-danger">
            {t("beforeLabel")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">{t("beforeTitle")}</h3>
          <ul className="mt-6 space-y-3">
            {beforeItems.map((key) => (
              <li
                key={key}
                className="rounded-xl border border-subtle/70 bg-surface/60 px-4 py-3 text-sm text-muted"
              >
                {t(`before.${key}`)}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-accent-success/30 bg-accent-success/[0.05] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-success">
            {t("afterLabel")}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-primary">{t("afterTitle")}</h3>
          <ul className="mt-6 space-y-3">
            {afterItems.map((key) => (
              <li
                key={key}
                className="rounded-xl border border-subtle/70 bg-surface/70 px-4 py-3 text-sm text-primary"
              >
                {t(`after.${key}`)}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </Section>
  );
}
