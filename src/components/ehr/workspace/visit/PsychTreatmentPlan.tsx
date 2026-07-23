"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface PsychTreatmentData {
  psychotherapyNotes: string;
  homework: string;
  lifestyleAdvice: string;
  goalsNextSession: string;
  medicationChanges: string;
}

export const DEFAULT_PSYCH_TREATMENT: PsychTreatmentData = {
  psychotherapyNotes: "",
  homework: "",
  lifestyleAdvice: "",
  goalsNextSession: "",
  medicationChanges: "",
};

interface PsychTreatmentPlanProps {
  value: PsychTreatmentData;
  onChange: (value: PsychTreatmentData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  stepNumber: number;
}

const FIELDS: { key: keyof PsychTreatmentData; rows: number }[] = [
  { key: "psychotherapyNotes", rows: 4 },
  { key: "homework", rows: 3 },
  { key: "lifestyleAdvice", rows: 3 },
  { key: "goalsNextSession", rows: 3 },
  { key: "medicationChanges", rows: 2 },
];

export function PsychTreatmentPlan({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  stepNumber,
}: PsychTreatmentPlanProps) {
  const t = useTranslations("ehr.workspace.psychiatry");

  function handleFieldChange(field: keyof PsychTreatmentData, val: string) {
    onChange({ ...value, [field]: val });
  }

  const filledFields = FIELDS.filter((f) => value[f.key].trim());
  const summary = filledFields
    .map((f) => `${t(`psych_${f.key}`)}: ${value[f.key].trim().slice(0, 25)}…`)
    .slice(0, 2)
    .join(" · ");

  return (
    <section
      id="visit-psych-plan"
      onClick={() => {
        if (isCollapsed) onFocus();
      }}
      className={[
        "rounded-2xl border bg-surface/40 p-5 transition-all duration-200 text-start",
        isActive
          ? "border-accent ring-1 ring-accent/20"
          : "border-subtle/70 hover:border-subtle",
        isCollapsed ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            {stepNumber}
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("psychPlanTitle")}</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="rounded-lg p-1 text-muted hover:bg-elevated hover:text-primary hide-on-print"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted">{t("psychPlanHint")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.key === "psychotherapyNotes" ? "sm:col-span-2" : ""}>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                  {t(`psych_${f.key}`)}
                </label>
                <textarea
                  value={value[f.key]}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  onFocus={onFocus}
                  rows={f.rows}
                  placeholder={t("psychFieldPlaceholder")}
                  className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary || <span className="text-muted/60">{t("psychPlanEmpty")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
