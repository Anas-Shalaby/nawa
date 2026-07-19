"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useState } from "react";

interface VitalsData {
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  weight: string;
}

interface ClinicalExamProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  vitals: VitalsData;
  onVitalsChange: (vitals: VitalsData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function ClinicalExam({
  notes,
  onNotesChange,
  vitals,
  onVitalsChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: ClinicalExamProps) {
  const t = useTranslations("ehr.workspace.visit");
  const [showVitals, setShowVitals] = useState(false);

  function handleVitalChange(field: keyof VitalsData, val: string) {
    onVitalsChange({
      ...vitals,
      [field]: val,
    });
  }

  // Generate collapsed summary label
  const vitalsSummary = [
    vitals.heartRate && `HR: ${vitals.heartRate}`,
    vitals.bloodPressure && `BP: ${vitals.bloodPressure}`,
    vitals.temperature && `Temp: ${vitals.temperature}°C`,
    vitals.weight && `Wt: ${vitals.weight}kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  const collapsedSummary = [
    vitalsSummary && `Vitals: ${vitalsSummary}`,
    notes.trim() && `Exam: ${notes.trim().slice(0, 40)}...`,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <section
      id="visit-exam"
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
            3
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("step3")}</h2>
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
          <p className="text-xs text-muted">{t("stepDescription3")}</p>

          {/* Vitals expander */}
          <div className="rounded-xl border border-subtle bg-elevated/10 p-3">
            <button
              type="button"
              onClick={() => {
                setShowVitals((v) => !v);
                onFocus();
              }}
              className="flex w-full items-center justify-between text-xs font-semibold text-primary/80 transition hover:text-accent"
            >
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-accent" />
                {t("examVitals")}
                {vitalsSummary && <span className="text-[11px] font-normal text-muted">({vitalsSummary})</span>}
              </span>
              <span>{showVitals ? t("collapseRx") : t("insertTemplate")}</span>
            </button>

            {showVitals ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted mb-1">
                    {t("vitalHR")}
                  </label>
                  <input
                    type="text"
                    value={vitals.heartRate}
                    onChange={(e) => handleVitalChange("heartRate", e.target.value)}
                    onFocus={onFocus}
                    placeholder="e.g. 72"
                    dir="ltr"
                    className="w-full rounded-lg border border-subtle bg-elevated/40 px-2.5 py-1.5 text-xs text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted mb-1">
                    {t("vitalBP")}
                  </label>
                  <input
                    type="text"
                    value={vitals.bloodPressure}
                    onChange={(e) => handleVitalChange("bloodPressure", e.target.value)}
                    onFocus={onFocus}
                    placeholder="e.g. 120/80"
                    dir="ltr"
                    className="w-full rounded-lg border border-subtle bg-elevated/40 px-2.5 py-1.5 text-xs text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted mb-1">
                    {t("vitalTemp")}
                  </label>
                  <input
                    type="text"
                    value={vitals.temperature}
                    onChange={(e) => handleVitalChange("temperature", e.target.value)}
                    onFocus={onFocus}
                    placeholder="e.g. 37.0"
                    dir="ltr"
                    className="w-full rounded-lg border border-subtle bg-elevated/40 px-2.5 py-1.5 text-xs text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted mb-1">
                    {t("vitalWeight")}
                  </label>
                  <input
                    type="text"
                    value={vitals.weight}
                    onChange={(e) => handleVitalChange("weight", e.target.value)}
                    onFocus={onFocus}
                    placeholder="e.g. 70"
                    dir="ltr"
                    className="w-full rounded-lg border border-subtle bg-elevated/40 px-2.5 py-1.5 text-xs text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Exam notes */}
          <div>
            <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
              {t("examNotes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              onFocus={onFocus}
              rows={4}
              placeholder={t("examNotesPlaceholder")}
              className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
            />
          </div>
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {collapsedSummary || <span className="text-muted/60">{t("none")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
