"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

interface InvestigationData {
  lab: string;
  imaging: string;
  other: string;
}

interface InvestigationPanelProps {
  value: InvestigationData;
  onChange: (value: InvestigationData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function InvestigationPanel({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: InvestigationPanelProps) {
  const t = useTranslations("ehr.workspace.visit");

  function handleFieldChange(field: keyof InvestigationData, val: string) {
    onChange({
      ...value,
      [field]: val,
    });
  }

  const summary = [
    value.lab.trim() && `${t("investLab")}: ${value.lab.trim().slice(0, 20)}`,
    value.imaging.trim() && `${t("investImaging")}: ${value.imaging.trim().slice(0, 20)}`,
    value.other.trim() && `${t("investOther")}: ${value.other.trim().slice(0, 20)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      id="visit-investigations"
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
            {t("step5")}{" "}
            <span className="text-[11px] font-normal text-muted font-arabic">({t("insertTemplate")})</span>
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
          <p className="text-xs text-muted">{t("stepDescription5")}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                {t("investLab")}
              </label>
              <textarea
                value={value.lab}
                onChange={(e) => handleFieldChange("lab", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("investPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                {t("investImaging")}
              </label>
              <textarea
                value={value.imaging}
                onChange={(e) => handleFieldChange("imaging", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("investPlaceholder")}
                className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                {t("investOther")}
              </label>
              <textarea
                value={value.other}
                onChange={(e) => handleFieldChange("other", e.target.value)}
                onFocus={onFocus}
                rows={3}
                placeholder={t("investPlaceholder")}
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
