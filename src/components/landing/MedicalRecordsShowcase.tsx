"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileImage,
  FileText,
  FlaskConical,
  History,
  Pill,
  Scan,
} from "lucide-react";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";

const TABS = [
  { key: "timeline", icon: History },
  { key: "labs", icon: FlaskConical },
  { key: "imaging", icon: Scan },
  { key: "files", icon: FileText },
  { key: "media", icon: FileImage },
  { key: "rx", icon: Pill },
] as const;

export function MedicalRecordsShowcase() {
  const t = useTranslations("landing.records");
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("timeline");

  return (
    <Section ariaLabelledBy="landing-records-title">
      <SectionHeading
        id="landing-records-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-subtle/80 bg-surface/80">
        <div className="flex gap-2 overflow-x-auto border-b border-subtle/80 px-4 py-3">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={[
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                active === key
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-elevated hover:text-primary",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        <div className="grid gap-0 lg:grid-cols-[16rem_1fr]">
          <aside className="border-b border-subtle/80 bg-elevated/30 p-5 lg:border-b-0 lg:border-e">
            <p className="text-xs font-semibold text-muted">{t("patientLabel")}</p>
            <p className="mt-2 text-lg font-semibold text-primary">{t("patientName")}</p>
            <p className="mt-1 text-xs text-muted">{t("patientMeta")}</p>
            <div className="mt-5 space-y-2">
              {(["plan", "allergy", "lastVisit"] as const).map((key) => (
                <div
                  key={key}
                  className="rounded-xl border border-subtle/70 bg-base/40 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    {t(`sidebar.${key}Label`)}
                  </p>
                  <p className="mt-1 text-sm text-primary">{t(`sidebar.${key}`)}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="p-5 md:p-6">
            <h3 className="text-base font-semibold text-primary">{t(`panels.${active}.title`)}</h3>
            <p className="mt-1 text-sm text-muted">{t(`panels.${active}.body`)}</p>
            <ul className="mt-5 space-y-2">
              {([1, 2, 3] as const).map((n) => (
                <li
                  key={n}
                  className="rounded-xl border border-subtle/70 bg-elevated/40 px-4 py-3"
                >
                  <p className="text-sm font-medium text-primary">
                    {t(`panels.${active}.item${n}Title`)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t(`panels.${active}.item${n}Meta`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
