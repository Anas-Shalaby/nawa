"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Calendar, CheckSquare, DollarSign, Heart, ShieldAlert, Sparkles, User } from "lucide-react";

interface PinnedSummaryProps {
  patientName: string;
  balanceDue: number;
  lastVisitDate: string | null;
  upcomingFollowUp: string | null;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
  recentDiagnosis: string | null;
  locale: string;
  onEditPatient?: () => void;
}

export function PinnedSummary({
  patientName,
  balanceDue,
  lastVisitDate,
  upcomingFollowUp,
  allergies = [],
  chronicDiseases = [],
  currentMedications = [],
  recentDiagnosis,
  locale,
  onEditPatient,
}: PinnedSummaryProps) {
  const t = useTranslations("ehr.workspace.timeline");
  const tCommon = useTranslations("ehr");
  const isAr = locale === "ar";

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 hide-on-print">
      
      {/* 1. Alerts & Allergies */}
      <div className="flex flex-col justify-between p-4 bg-accent-danger/5 border border-accent-danger/20 rounded-2xl text-start">
        <div>
          <div className="flex items-center gap-1.5 text-accent-danger font-semibold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{t("alertsAndAllergies")}</span>
          </div>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-accent-danger/10 px-2 py-0.5 text-xs font-medium text-accent-danger"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted/80 italic mt-1">
              {isAr ? "لا توجد حساسيات معروفة" : "No known allergies"}
            </p>
          )}
        </div>
        {chronicDiseases.length > 0 && (
          <div className="mt-3 pt-3 border-t border-accent-danger/10">
            <p className="text-[11px] text-accent-danger/70 font-medium">
              {isAr ? "الأمراض المزمنة:" : "Chronic Diseases:"}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {chronicDiseases.map((disease, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold text-accent-danger bg-accent-danger/5 px-1.5 py-0.5 rounded"
                >
                  {disease}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Current Medications */}
      <div className="p-4 bg-accent-success/5 border border-accent-success/20 rounded-2xl text-start flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-accent-success font-semibold text-xs uppercase tracking-wider mb-2">
            <Heart className="h-4 w-4" />
            <span>{t("currentMedications")}</span>
          </div>
          {currentMedications.length > 0 ? (
            <ul className="space-y-1 mt-1 max-h-[80px] overflow-y-auto custom-scrollbar">
              {currentMedications.map((med, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                  <span className="h-1 w-1 bg-accent-success rounded-full" />
                  {med}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted/80 italic mt-1">
              {isAr ? "لا توجد أدوية مستمرة حالياً" : "No active chronic medications"}
            </p>
          )}
        </div>
      </div>

      {/* 3. Recent Diagnosis */}
      <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl text-start flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-accent font-semibold text-xs uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>{t("recentDiagnosis")}</span>
          </div>
          {recentDiagnosis ? (
            <p className="text-sm font-semibold text-primary mt-1 line-clamp-2">
              {recentDiagnosis}
            </p>
          ) : (
            <p className="text-xs text-muted/80 italic mt-1">
              {isAr ? "لا يوجد تشخيص مسجل مؤخراً" : "No recent diagnosis"}
            </p>
          )}
        </div>
        <div className="mt-2 text-[10px] text-muted font-medium">
          {isAr ? "آخر زيارة: " : "Last Visit: "}
          {lastVisitDate ? lastVisitDate : (isAr ? "لا يوجد" : "None")}
        </div>
      </div>

      {/* 4. Financial & Next Visit */}
      <div className="p-4 bg-elevated/40 border border-subtle/50 rounded-2xl text-start flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">
              {isAr ? "الرصيد المعلق" : "Balance Due"}
            </div>
            {balanceDue > 0 ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-danger/10 px-2 py-0.5 text-[10px] font-bold text-accent-danger animate-pulse">
                <DollarSign className="h-3 w-3" />
                {balanceDue}
              </span>
            ) : (
              <span className="text-[10px] text-accent-success font-semibold">
                {isAr ? "مسدد بالكامل" : "Paid"}
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              <span>{isAr ? "الموعد القادم" : "Next Appointment"}</span>
            </div>
            <p className="text-xs font-semibold text-primary mt-1">
              {upcomingFollowUp ? upcomingFollowUp : (isAr ? "غير مجدول" : "Not scheduled")}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
