"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface MseData {
  appearance: string;
  behavior: string;
  speech: string;
  mood: string;
  affect: string;
  thoughtProcess: string;
  thoughtContent: string;
  perception: string;
  insight: string;
  judgment: string;
  cognition: string;
}

export const DEFAULT_MSE: MseData = {
  appearance: "",
  behavior: "",
  speech: "",
  mood: "",
  affect: "",
  thoughtProcess: "",
  thoughtContent: "",
  perception: "",
  insight: "",
  judgment: "",
  cognition: "",
};

interface MseCardProps {
  value: MseData;
  onChange: (value: MseData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  stepNumber: number;
}

const MSE_FIELDS: (keyof MseData)[] = [
  "appearance",
  "behavior",
  "speech",
  "mood",
  "affect",
  "thoughtProcess",
  "thoughtContent",
  "perception",
  "insight",
  "judgment",
  "cognition",
];

export function MseCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  stepNumber,
}: MseCardProps) {
  const t = useTranslations("ehr.workspace.psychiatry");

  function handleFieldChange(field: keyof MseData, val: string) {
    onChange({ ...value, [field]: val });
  }

  const filledCount = MSE_FIELDS.filter((f) => value[f].trim()).length;
  const summaryText =
    filledCount > 0
      ? `${filledCount}/${MSE_FIELDS.length} fields documented`
      : null;

  return (
    <section
      id="visit-mse"
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
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-semibold text-purple-600 dark:text-purple-400">
            {stepNumber}
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("mseTitle")}</h2>
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
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">{t("mseHint")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MSE_FIELDS.map((field) => (
              <div key={field}>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                  {t(`mse_${field}`)}
                </label>
                <input
                  type="text"
                  value={value[field]}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  onFocus={onFocus}
                  placeholder={t("mseFieldPlaceholder")}
                  className="w-full rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summaryText || <span className="text-muted/60">{t("mseEmpty")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
