"use client";

import { useLocale, useTranslations } from "next-intl";
import { Pill } from "lucide-react";
import { formatLineInstruction } from "@/lib/clinical/prescriptionFormat";
import type { Locale } from "@/i18n/routing";
import type { ChronicMedicationRecord } from "@/lib/clinical/prescriptionTypes";
import type { PatientFamily } from "@/lib/queries/patients";

interface ClinicalSummaryProps {
  allergies: string[];
  chronicDiseases: string[];
  chronicMedications: ChronicMedicationRecord[];
  balanceDue: number;
  lastVisitDate: string | null;
  lastDiagnosis: string | null;
  noShowCount: number;
  family: PatientFamily | undefined;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

export function ClinicalSummary({
  allergies,
  chronicDiseases,
  chronicMedications,
  balanceDue,
  lastVisitDate,
  lastDiagnosis,
  noShowCount,
  family,
}: ClinicalSummaryProps) {
  const t = useTranslations("ehr");
  const tw = useTranslations("ehr.workspace");
  const locale = useLocale() as Locale;

  const alerts: string[] = [];
  if (noShowCount > 0) alerts.push(tw("alerts.strikes", { count: noShowCount }));
  if (balanceDue > 0) {
    alerts.push(
      tw("alerts.balance", {
        amount: formatMoney(balanceDue, locale),
        currency: t("currency"),
      }),
    );
  }

  const familyCount =
    (family?.parent ? 1 : 0) + (family?.dependents?.length ?? 0);

  return (
    <section className="mb-10 text-start" aria-label={tw("summaryTitle")}>
      <h2 className="text-sm font-semibold text-primary">{tw("summaryTitle")}</h2>
      <p className="mt-1 text-xs text-muted">{tw("summaryHint")}</p>

      <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Blood Type */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("bloodType")}
          </dt>
          <dd className="mt-1 text-sm text-primary">{tw("notRecorded")}</dd>
        </div>

        {/* Allergies */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("allergies")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {allergies.length === 0 ? (
              tw("notRecorded")
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="rounded-md bg-accent-danger/10 px-2 py-0.5 text-xs font-medium text-accent-danger"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            )}
          </dd>
        </div>

        {/* Chronic Diseases */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("chronicDiseases")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {chronicDiseases.length === 0 ? (
              tw("notRecorded")
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {chronicDiseases.map((disease) => (
                  <span
                    key={disease}
                    className="rounded-md bg-accent-warning/10 px-2 py-0.5 text-xs font-medium text-accent-warning"
                  >
                    {disease}
                  </span>
                ))}
              </div>
            )}
          </dd>
        </div>

        {/* Current Medications */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("currentMeds")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {chronicMedications.length === 0 ? (
              tw("none")
            ) : (
              <ul className="space-y-1">
                {chronicMedications.slice(0, 4).map((med) => (
                  <li key={med.id} className="flex items-start gap-1.5">
                    <Pill className="mt-0.5 h-3 w-3 shrink-0 text-muted" aria-hidden />
                    <span>
                      {med.medicineName}
                      <span className="text-muted">
                        {" "}
                        ·{" "}
                        {formatLineInstruction({
                          ...med,
                          isChronic: true,
                          isCustom: false,
                        })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        {/* Last Diagnosis */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("lastDiagnosis")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {lastDiagnosis ?? tw("none")}
          </dd>
        </div>

        {/* Outstanding Balance */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("statBalance")}
          </dt>
          <dd
            className={[
              "mt-1 text-sm font-semibold tabular-nums",
              balanceDue > 0 ? "text-accent-danger" : "text-primary",
            ].join(" ")}
          >
            {formatMoney(balanceDue, locale)} {t("currency")}
          </dd>
        </div>

        {/* Last Visit */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {t("statLastVisit")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {lastVisitDate ? formatShortDate(lastVisitDate, locale) : t("pillNoVisit")}
          </dd>
        </div>

        {/* Alerts */}
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {tw("alertsTitle")}
          </dt>
          <dd className="mt-1 text-sm text-primary">
            {alerts.length === 0 ? (
              <span className="text-muted">{tw("noAlerts")}</span>
            ) : (
              <ul className="space-y-1">
                {alerts.map((alert) => (
                  <li key={alert} className="text-accent-danger">
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        {/* Family Members */}
        {familyCount > 0 ? (
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {tw("familyMembers")}
            </dt>
            <dd className="mt-1 text-sm text-primary">
              {tw("familyCount", { count: familyCount })}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
