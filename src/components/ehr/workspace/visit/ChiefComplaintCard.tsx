"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ChiefComplaintCardProps {
  value: string;
  onChange: (value: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  specialty?: string;
  locale?: string;
}

const SUGGESTIONS = [
  "Fever / حمى",
  "Headache / صداع",
  "Cough / سعال",
  "Chest Pain / ألم في الصدر",
  "Abdominal Pain / ألم في البطن",
  "Shortness of Breath / ضيق تنفس",
];

export function ChiefComplaintCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  specialty,
  locale = "ar",
}: ChiefComplaintCardProps) {
  const t = useTranslations("ehr.workspace.visit");
  const isPsychiatry = specialty?.toLowerCase().includes("psych") ?? false;
  const isAr = locale === "ar";

  const psychiatrySuggestions = [
    isAr ? "قلق / Anxiety" : "Anxiety / قلق",
    isAr ? "اكتئاب / Depression" : "Depression / اكتئاب",
    isAr ? "تقلبات مزاجية / Mood swings" : "Mood swings / تقلبات مزاجية",
    isAr ? "أرق / Insomnia" : "Insomnia / أرق",
    isAr ? "نوبة هلع / Panic attack" : "Panic attack / نوبة هلع",
    isAr ? "إجهاد نفسي / Stress" : "Stress / إجهاد نفسي",
  ];

  const suggestions = isPsychiatry ? psychiatrySuggestions : SUGGESTIONS;

  return (
    <section
      id="visit-cc"
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
            1
          </span>
          <h2 className="text-sm font-semibold text-primary">
            {isPsychiatry ? (isAr ? "ملاحظات الجلسة والشكوى الرئيسية" : "Session Notes & Chief Complaint") : t("step1")}
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
            {isPsychiatry ? (isAr ? "اكتب شكوى العميل وتفاصيل الحوار الإكلينيكي هنا" : "Record the client's chief complaint and clinical session notes here") : t("stepDescription1")}
          </p>
          
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            rows={5}
            placeholder={isPsychiatry ? (isAr ? "اكتب ملاحظات الجلسة هنا..." : "Record dialogue, therapy logs, and observations here...") : t("ccPlaceholder")}
            className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />

          {/* Suggestions */}
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
              {isPsychiatry ? (isAr ? "أعراض شائعة" : "Common Symptoms") : t("ccSuggest")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const current = value.trim();
                    const separator = current ? " · " : "";
                    onChange(current + separator + s);
                  }}
                  className="rounded-lg bg-elevated px-2 py-1 text-xs font-medium text-muted hover:bg-subtle hover:text-primary transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {value.trim() ? value : <span className="text-muted/60">{t("none")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
