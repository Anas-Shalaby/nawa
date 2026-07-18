"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Section } from "./marketing/Section";
import { SectionHeading } from "./marketing/SectionHeading";
import { LandingCTA } from "./marketing/LandingCTA";

export function RoiCalculatorSection() {
  const t = useTranslations("landing.roi");
  const [patients, setPatients] = useState(25);
  const [noShowRate, setNoShowRate] = useState(18);
  const [ticket, setTicket] = useState(350);
  const [adminHours, setAdminHours] = useState(4);

  const result = useMemo(() => {
    const recoveredRate = Math.min(noShowRate * 0.45, noShowRate);
    const recoveredAppointments = Math.round(patients * (recoveredRate / 100) * 22);
    const extraRevenue = recoveredAppointments * ticket;
    const hoursSaved = Math.round(adminHours * 22 * 0.55);
    const timeValue = hoursSaved * 120;
    return { recoveredAppointments, extraRevenue, hoursSaved, timeValue };
  }, [patients, noShowRate, ticket, adminHours]);

  return (
    <Section ariaLabelledBy="landing-roi-title">
      <SectionHeading
        id="landing-roi-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5 rounded-[1.75rem] border border-subtle/80 bg-surface/80 p-6 md:p-7">
          <SliderField
            label={t("patientsLabel")}
            value={patients}
            min={8}
            max={60}
            onChange={setPatients}
            suffix={t("patientsSuffix")}
          />
          <SliderField
            label={t("noShowLabel")}
            value={noShowRate}
            min={5}
            max={40}
            onChange={setNoShowRate}
            suffix="%"
          />
          <SliderField
            label={t("ticketLabel")}
            value={ticket}
            min={150}
            max={1200}
            step={25}
            onChange={setTicket}
            suffix={t("currency")}
          />
          <SliderField
            label={t("adminLabel")}
            value={adminHours}
            min={1}
            max={10}
            onChange={setAdminHours}
            suffix={t("hoursSuffix")}
          />
          <p className="text-xs text-muted">{t("disclaimer")}</p>
        </div>

        <div className="flex flex-col rounded-[1.75rem] border border-accent/20 bg-accent/[0.04] p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {t("resultEyebrow")}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ResultCard
              label={t("recoveredLabel")}
              value={String(result.recoveredAppointments)}
              hint={t("recoveredHint")}
            />
            <ResultCard
              label={t("revenueLabel")}
              value={`${result.extraRevenue.toLocaleString()} ${t("currency")}`}
              hint={t("revenueHint")}
            />
            <ResultCard
              label={t("hoursLabel")}
              value={String(result.hoursSaved)}
              hint={t("hoursHint")}
            />
            <ResultCard
              label={t("timeValueLabel")}
              value={`${result.timeValue.toLocaleString()} ${t("currency")}`}
              hint={t("timeValueHint")}
            />
          </div>

          <div className="mt-auto pt-8">
            <LandingCTA href="/register?plan=free_6mo" className="w-full min-h-[48px]">
              {t("cta")}
            </LandingCTA>
          </div>
        </div>
      </div>
    </Section>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-sm text-primary">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-[var(--accent)]"
      />
    </label>
  );
}

function ResultCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-subtle/70 bg-base/50 px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  );
}
