"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Calendar, CreditCard, Heart, ShieldAlert, User } from "lucide-react";

interface ClinicalSummaryPanelProps {
  currentMedications: string[];
  allergies: string[];
  chronicDiseases: string[];
  balanceDue: number;
  nextAppointment: string | null;
  primaryDoctor: string | null;
  locale: string;
}

export function ClinicalSummaryPanel({
  currentMedications = [],
  allergies = [],
  chronicDiseases = [],
  balanceDue,
  nextAppointment,
  primaryDoctor,
  locale,
}: ClinicalSummaryPanelProps) {
  const t = useTranslations("ehr.workspace.timeline");
  const isAr = locale === "ar";

  return (
    <aside className="sticky top-24 bg-surface border border-subtle/80 rounded-2xl p-5 space-y-6 text-start shadow-sm hide-on-print">
      
      {/* Head section */}
      <div>
        <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 border-b border-subtle pb-3">
          <Heart className="h-4.5 w-4.5 text-accent" />
          <span>{isAr ? "الملخص الطبي الدائم" : "Active Clinical Facts"}</span>
        </h3>
      </div>

      {/* Allergies & Alerts */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="h-4 w-4 text-accent-danger" />
          <span>{isAr ? "الحساسية والتنبيهات" : "Allergies & Alerts"}</span>
        </div>
        {allergies.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {allergies.map((allergy, i) => (
              <span
                key={i}
                className="rounded-lg bg-accent-danger/10 px-2.5 py-0.5 text-xs font-semibold text-accent-danger"
              >
                {allergy}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/70 italic">
            {isAr ? "لا توجد حساسيات مسجلة" : "No registered allergies"}
          </p>
        )}
      </div>

      {/* Chronic Diseases */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-accent" />
          <span>{isAr ? "الأمراض المزمنة" : "Chronic Conditions"}</span>
        </div>
        {chronicDiseases.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chronicDiseases.map((disease, i) => (
              <span
                key={i}
                className="rounded-lg bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent"
              >
                {disease}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted/70 italic">
            {isAr ? "لا توجد أمراض مزمنة مسجلة" : "No chronic conditions"}
          </p>
        )}
      </div>

      {/* Medications */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
          <Heart className="h-4 w-4 text-accent-success" />
          <span>{isAr ? "الأدوية المستمرة" : "Chronic Medications"}</span>
        </div>
        {currentMedications.length > 0 ? (
          <ul className="space-y-2">
            {currentMedications.map((med, i) => (
              <li
                key={i}
                className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2 bg-elevated/40 border border-subtle/40 rounded-xl px-2.5 py-1.5"
              >
                <span className="h-1.5 w-1.5 bg-accent-success rounded-full flex-shrink-0" />
                <span className="truncate">{med}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted/70 italic">
            {isAr ? "لا توجد أدوية مستمرة موصوفة" : "No continuous medications"}
          </p>
        )}
      </div>

      {/* Financials & Visits info */}
      <div className="border-t border-subtle/80 pt-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1">
            <CreditCard className="h-3.5 w-3.5" />
            {isAr ? "الحساب المستحق:" : "Outstanding balance:"}
          </span>
          <span className={`font-bold ${balanceDue > 0 ? "text-accent-danger font-mono" : "text-accent-success"}`}>
            {balanceDue} {isAr ? "ج.م" : "EGP"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {isAr ? "الزيارة القادمة:" : "Next Session:"}
          </span>
          <span className="font-semibold text-primary">
            {nextAppointment ? nextAppointment : (isAr ? "غير مجدولة" : "Not scheduled")}
          </span>
        </div>

        {primaryDoctor && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {isAr ? "الطبيب المعالج:" : "Primary Doctor:"}
            </span>
            <span className="font-semibold text-primary truncate max-w-[120px]">
              {primaryDoctor}
            </span>
          </div>
        )}
      </div>

    </aside>
  );
}
