"use client";

import { Brain, ChevronDown, ChevronUp } from "lucide-react";

export interface MseData {
  appearance?: string;
  behavior?: string;
  speech?: string;
  mood?: string;
  affect?: string;
  thoughtProcess?: string;
  thoughtContent?: string;
  perception?: string;
  insight?: string;
  judgment?: string;
  cognition?: string;
}

interface MseCardProps {
  data: MseData;
  onChange: (next: MseData) => void;
  locale: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function MseCard({
  data,
  onChange,
  locale,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: MseCardProps) {
  const isAr = locale === "ar";

  const fields = [
    { key: "appearance", label: isAr ? "المظهر الخارجي" : "Appearance", placeholder: isAr ? "الهيئة، النظافة الشخصية، الملبس..." : "Grooming, hygiene, posture, dress..." },
    { key: "behavior", label: isAr ? "السلوك والحركة" : "Behavior & Motor", placeholder: isAr ? "الاتصال البصري، فرط الحركة، الهدوء..." : "Eye contact, psychomotor agitation, gait..." },
    { key: "speech", label: isAr ? "الكلام والحديث" : "Speech", placeholder: isAr ? "السرعة، النبرة، الوضوح، التدفق..." : "Rate, volume, clarity, latency..." },
    { key: "mood", label: isAr ? "المزاج (ذاتي)" : "Mood (Subjective)", placeholder: isAr ? "كيف يصف المريض مزاجه الحالي..." : "How the patient describes their feelings..." },
    { key: "affect", label: isAr ? "الوجدان والوجاهة (موضوعي)" : "Affect (Objective)", placeholder: isAr ? "تعبيرات الوجه، التناسق، المدى الوجداني..." : "Range, congruence, responsiveness..." },
    { key: "thoughtProcess", label: isAr ? "مجرى التفكير" : "Thought Process", placeholder: isAr ? "ترابط الأفكار، التشتت، التفكير السريع..." : "Linearity, tangentiality, flight of ideas..." },
    { key: "thoughtContent", label: isAr ? "محتوى التفكير" : "Thought Content", placeholder: isAr ? "الأفكار الوسواسية، الضلالات، الأوهام..." : "Delusions, obsessions, suicidal ideation..." },
    { key: "perception", label: isAr ? "الإدراك الحسي" : "Perception", placeholder: isAr ? "الهلاوس السمعية أو البصرية..." : "Hallucinations, illusions, depersonalization..." },
    { key: "insight", label: isAr ? "الاستبصار" : "Insight", placeholder: isAr ? "مدى وعي المريض بحالته وحاجته للعلاج..." : "Awareness of illness and need for treatment..." },
    { key: "judgment", label: isAr ? "الحصافة والتقدير" : "Judgment", placeholder: isAr ? "القدرة على اتخاذ القرارات وحل المشكلات..." : "Decision-making capability in social contexts..." },
    { key: "cognition", label: isAr ? "الإدراك والذاكرة" : "Cognition", placeholder: isAr ? "التركيز، الانتباه، الذاكرة القريبة والبعيدة..." : "Orientation, memory, attention span..." },
  ];

  function handleFieldChange(key: keyof MseData, value: string) {
    onChange({
      ...data,
      [key]: value,
    });
  }

  return (
    <section
      id="visit-mse"
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
          <h2 className="text-sm font-semibold text-primary">
            {isAr ? "فحص الحالة العقلية والنفسية (MSE)" : "Mental Status Examination (MSE)"}
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
            {isAr ? "تقييم سريري موضوعي وسلوكي للمريض (جميع الحقول اختيارية)" : "Clinical objective assessment of patient status (All fields are optional)"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const value = data[field.key as keyof MseData] || "";
              return (
                <div key={field.key} className="space-y-1.5 flex flex-col">
                  <label htmlFor={`mse-${field.key}`} className="text-xs font-semibold text-primary/95">
                    {field.label}
                  </label>
                  <textarea
                    id={`mse-${field.key}`}
                    rows={2}
                    value={value}
                    onChange={(e) => handleFieldChange(field.key as keyof MseData, e.target.value)}
                    onFocus={onFocus}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-subtle/80 bg-elevated/40 px-3 py-2 text-xs text-primary transition placeholder:text-muted/60 focus:border-accent focus:bg-surface focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {Object.entries(data)
              .filter(([_, v]) => !!v?.trim())
              .map(([k, v]) => `${fields.find(f => f.key === k)?.label}: ${v!.trim().slice(0, 15)}`)
              .join(" · ") || <span className="text-muted/60">{isAr ? "لا يوجد" : "None"}</span>}
          </p>
        </div>
      )}

    </section>
  );
}
