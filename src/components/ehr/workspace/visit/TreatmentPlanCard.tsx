"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TreatmentPlanData {
  notes: string;
  lifestyle: string;
  procedures: string;
  instructions: string;
}

interface TreatmentPlanCardProps {
  value: TreatmentPlanData;
  onChange: (value: TreatmentPlanData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  specialty?: string;
  locale?: string;
}

export function TreatmentPlanCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  specialty,
  locale = "ar",
}: TreatmentPlanCardProps) {
  const t = useTranslations("ehr.workspace.visit");
  const isPsychiatry = specialty?.toLowerCase().includes("psych") ?? false;
  const isAr = locale === "ar";

  const labelNotes = isPsychiatry
    ? (isAr ? "ملاحظات العلاج النفسي" : "Psychotherapy Notes")
    : t("plan");

  const labelLifestyle = isPsychiatry
    ? (isAr ? "نصائح نمط الحياة" : "Lifestyle Advice")
    : t("treatmentLifestyle");

  const labelProcedures = isPsychiatry
    ? (isAr ? "الواجبات والأهداف العلاجية" : "Homework & Goals Until Next Session")
    : t("treatmentProcedures");

  const labelInstructions = isPsychiatry
    ? (isAr ? "التعديلات الدوائية المقترحة" : "Medication Changes")
    : t("treatmentInstructions");

  function handleFieldChange(field: keyof TreatmentPlanData, val: string) {
    onChange({
      ...value,
      [field]: val,
    });
  }

  const summary = [
    value.notes.trim() && `${labelNotes}: ${value.notes.trim().slice(0, 20)}`,
    value.lifestyle.trim() && `${labelLifestyle}: ${value.lifestyle.trim().slice(0, 20)}`,
    value.procedures.trim() && `${labelProcedures}: ${value.procedures.trim().slice(0, 20)}`,
    value.instructions.trim() && `${labelInstructions}: ${value.instructions.trim().slice(0, 20)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      id="visit-plan"
      onClick={() => {
        if (isCollapsed) {
          onFocus();
        }
      }}
      className={[
        "rounded-2xl border bg-surface/40 p-5 transition-all duration-200 text-start",
        isActive
          ? "border-accent ring-1 ring-accent/20"
          : "border-subtle/70 hover:border-subtle",
        isCollapsed ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            5
          </span>
          <h2 className="text-sm font-semibold text-primary">
            {isPsychiatry ? (isAr ? "خطة العلاج والجلسات" : "Treatment & Therapy Plan") : t("step6")}
          </h2>
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

      {/* Card Body */}
      {!isCollapsed ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted">
            {isPsychiatry ? (isAr ? "قم بتوثيق خطة العلاج والواجبات المنزلية هنا" : "Document psychotherapy notes and guidelines here") : t("stepDescription6")}
          </p>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {labelNotes}
              </label>
              <textarea
                value={value.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("treatmentPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {labelLifestyle}
              </label>
              <textarea
                value={value.lifestyle}
                onChange={(e) => handleFieldChange("lifestyle", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("treatmentPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {labelProcedures}
              </label>
              <textarea
                value={value.procedures}
                onChange={(e) => handleFieldChange("procedures", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("treatmentPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {labelInstructions}
              </label>
              <textarea
                value={value.instructions}
                onChange={(e) => handleFieldChange("instructions", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("treatmentPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary || <span className="text-muted/60">{t("none")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
