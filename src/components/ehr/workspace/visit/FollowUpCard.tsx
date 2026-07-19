"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface FollowUpData {
  required: boolean;
  interval: "none" | "3d" | "1w" | "2w" | "1m" | "custom";
  customDate: string; // ISO date string
  notes: string;
}

interface FollowUpCardProps {
  value: FollowUpData;
  onChange: (value: FollowUpData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  onTriggerModal: () => void;
}

export function FollowUpCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  onTriggerModal,
}: FollowUpCardProps) {
  const t = useTranslations("ehr.workspace.visit");
  const locale = useLocale() as Locale;

  function setField<K extends keyof FollowUpData>(field: K, val: FollowUpData[K]) {
    onChange({
      ...value,
      [field]: val,
    });
  }

  const intervalLabels: Record<string, string> = {
    none: locale === "ar" ? "لا يوجد" : "None",
    "3d": locale === "ar" ? "بعد 3 أيام" : "In 3 days",
    "1w": locale === "ar" ? "بعد أسبوع" : "In 1 week",
    "2w": locale === "ar" ? "بعد أسبوعين" : "In 2 weeks",
    "1m": locale === "ar" ? "بعد شهر" : "In 1 month",
    custom: locale === "ar" ? "تاريخ مخصص" : "Custom Date",
  };

  const summary = value.required
    ? `${intervalLabels[value.interval]}${value.notes.trim() ? ` · Notes: ${value.notes}` : ""}`
    : t("followUpNone");

  return (
    <section
      id="visit-followup"
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
            8
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("step8")}</h2>
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
          <p className="text-xs text-muted">{t("stepDescription8")}</p>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <input
                type="radio"
                checked={!value.required}
                onChange={() => {
                  setField("required", false);
                  setField("interval", "none");
                  onFocus();
                }}
                className="text-accent focus:ring-accent"
              />
              {t("followUpNone")}
            </label>
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
              <input
                type="radio"
                checked={value.required}
                onChange={() => {
                  setField("required", true);
                  setField("interval", "1w");
                  onFocus();
                }}
                className="text-accent focus:ring-accent"
              />
              {t("followUpSelect")}
            </label>
          </div>

          {value.required ? (
            <div className="mt-3 space-y-3 pl-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(["3d", "1w", "2w", "1m", "custom"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setField("interval", opt);
                      onFocus();
                      if (opt === "custom") {
                        onTriggerModal();
                      }
                    }}
                    className={[
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                      value.interval === opt
                        ? "bg-accent text-white"
                        : "bg-elevated text-muted hover:text-primary",
                    ].join(" ")}
                  >
                    {intervalLabels[opt]}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                  {t("followUpNotes")}
                </label>
                <input
                  type="text"
                  value={value.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  onFocus={onFocus}
                  placeholder={t("notesPlaceholder")}
                  className="w-full rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={onTriggerModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
              >
                <Calendar className="h-3.5 w-3.5" />
                {locale === "ar" ? "افتح الأجندة للحجز" : "Open Schedule Calendar"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary}
          </p>
        </div>
      )}
    </section>
  );

  function handleFieldChange(field: keyof FollowUpData, val: string) {
    onChange({
      ...value,
      [field]: val,
    });
  }
}
