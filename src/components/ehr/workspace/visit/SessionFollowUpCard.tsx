"use client";

import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import type { Locale } from "@/i18n/routing";

interface SessionFollowUpData {
  required: boolean;
  interval: "none" | "1w" | "2w" | "1m" | "custom";
  customDate: string;
  notes: string;
}

interface SessionFollowUpCardProps {
  value: SessionFollowUpData;
  onChange: (value: SessionFollowUpData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  onTriggerModal: () => void;
  stepNumber: number;
}

export function SessionFollowUpCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  onTriggerModal,
  stepNumber,
}: SessionFollowUpCardProps) {
  const t = useTranslations("ehr.workspace.psychiatry");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  function setField<K extends keyof SessionFollowUpData>(field: K, val: SessionFollowUpData[K]) {
    onChange({ ...value, [field]: val });
  }

  const intervals: Array<{ id: SessionFollowUpData["interval"]; label: string }> = [
    { id: "none", label: isAr ? "لا يلزم" : "Not needed" },
    { id: "1w", label: isAr ? "أسبوع واحد" : "1 Week" },
    { id: "2w", label: isAr ? "أسبوعين" : "2 Weeks" },
    { id: "1m", label: isAr ? "شهر واحد" : "1 Month" },
    { id: "custom", label: isAr ? "تاريخ مخصص" : "Custom" },
  ];

  const selectedLabel = intervals.find((i) => i.id === value.interval)?.label || "";
  const summary = value.required
    ? `${selectedLabel}${value.notes.trim() ? ` · ${value.notes.trim().slice(0, 30)}` : ""}`
    : (isAr ? "لا يلزم متابعة" : "No follow-up needed");

  return (
    <section
      id="visit-session-followup"
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
          <h2 className="text-sm font-semibold text-primary">{t("nextSessionTitle")}</h2>
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
        <div className="mt-4 space-y-5">
          <p className="text-xs text-muted">{t("nextSessionHint")}</p>

          {/* Toggle: Is follow-up required? */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={value.required}
              onChange={(e) => {
                setField("required", e.target.checked);
                if (!e.target.checked) {
                  setField("interval", "none");
                }
              }}
              className="h-4 w-4 rounded border-subtle text-accent focus:ring-accent/30"
            />
            <span className="text-xs font-medium text-primary">{t("nextSessionRequired")}</span>
          </label>

          {/* Quick Interval Selectors */}
          {value.required && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {intervals
                  .filter((i) => i.id !== "none")
                  .map((interval) => {
                    const active = value.interval === interval.id;
                    return (
                      <button
                        key={interval.id}
                        type="button"
                        onClick={() => setField("interval", interval.id)}
                        className={[
                          "rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                          active
                            ? "border-accent bg-accent text-white"
                            : "border-subtle bg-surface text-primary hover:border-accent/40",
                        ].join(" ")}
                      >
                        {interval.label}
                      </button>
                    );
                  })}
              </div>

              {/* Custom date picker */}
              {value.interval === "custom" && (
                <div>
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                    {isAr ? "اختر تاريخ الجلسة القادمة" : "Select next session date"}
                  </label>
                  <input
                    type="date"
                    value={value.customDate}
                    onChange={(e) => setField("customDate", e.target.value)}
                    className="w-full max-w-xs rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary focus:border-accent/40 focus:outline-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted mb-1">
                  {isAr ? "ملاحظات الجلسة القادمة" : "Next session notes"}
                </label>
                <textarea
                  value={value.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  onFocus={onFocus}
                  rows={2}
                  placeholder={isAr ? "ماذا يجب مناقشته في الجلسة القادمة؟" : "What should be discussed next session?"}
                  className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none"
                />
              </div>

              {/* Schedule CTA */}
              <button
                type="button"
                onClick={onTriggerModal}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
              >
                <Calendar className="h-4 w-4" />
                <span>{t("scheduleNextSession")}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary}
          </p>
        </div>
      )}
    </section>
  );
}
