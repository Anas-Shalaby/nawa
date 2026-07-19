"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Heart, ShieldAlert, Activity, ClipboardList } from "lucide-react";

interface VisitSummaryCardProps {
  rawNotes: string | null | undefined;
  doctorName: string;
  serviceName: string;
  status: string;
  dateLabel: string;
  locale: string;
  prescribedLines?: Array<{
    medicineName: string;
    doseAmount: string;
    form: string;
    frequency: string;
    duration: string;
  }>;
}

interface StructuredVisit {
  version: "sprint3";
  chiefComplaint: string;
  history: {
    presentIllness: string;
    pastMedical: string;
    drug: string;
    family: string;
    social: string;
  };
  clinicalExamination: string;
  vitals: {
    heartRate: string;
    bloodPressure: string;
    temperature: string;
    weight: string;
  };
  assessment: {
    primaryDiagnosis: string;
    secondaryDiagnosis: string;
    notes: string;
  };
  investigations: {
    lab: string;
    imaging: string;
    other: string;
  };
  treatmentPlan: {
    notes: string;
    lifestyle: string;
    procedures: string;
    instructions: string;
  };
}

function parseVisitData(raw: string | null | undefined): StructuredVisit | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === "sprint3") {
      return parsed;
    }
  } catch (e) {
    // Normal fallback
  }
  return null;
}

export function VisitSummaryCard({
  rawNotes,
  doctorName,
  serviceName,
  status,
  dateLabel,
  locale,
  prescribedLines = [],
}: VisitSummaryCardProps) {
  const isAr = locale === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const structured = parseVisitData(rawNotes);

  // If not structured, show plain legacy notes
  if (!structured) {
    return (
      <div className="bg-elevated/20 border border-subtle/50 rounded-2xl p-4 text-start">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-semibold text-primary">{serviceName}</h4>
            <p className="text-xs text-muted mt-0.5">{doctorName} · {dateLabel}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {isAr ? "كشف إرثي" : "Legacy Visit"}
          </span>
        </div>
        {rawNotes?.trim() && (
          <p className="mt-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-surface border border-subtle/50 rounded-xl p-3 whitespace-pre-wrap">
            {rawNotes}
          </p>
        )}
      </div>
    );
  }

  const { chiefComplaint, history, clinicalExamination, vitals, assessment, investigations, treatmentPlan } = structured;

  // Highlights
  const hasVitals = vitals.heartRate || vitals.bloodPressure || vitals.temperature || vitals.weight;
  const hasHistory = history.presentIllness || history.pastMedical || history.drug || history.family || history.social;
  const hasInvestigations = investigations.lab || investigations.imaging || investigations.other;

  return (
    <div className="bg-elevated/20 border border-subtle/60 rounded-2xl p-4 text-start space-y-3">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-semibold text-primary">{serviceName}</h4>
          <p className="text-xs text-muted mt-0.5">
            {doctorName} · {dateLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:brightness-110"
        >
          <span>{isOpen ? (isAr ? "إخفاء التفاصيل" : "Show less") : (isAr ? "عرض التفاصيل" : "Show details")}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Core Diagnosis/Complaint Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {chiefComplaint.trim() && (
          <div className="bg-surface/50 border border-subtle/40 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-muted uppercase block mb-0.5">
              {isAr ? "الشكوى الرئيسية" : "Chief Complaint"}
            </span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
              {chiefComplaint}
            </p>
          </div>
        )}
        {assessment.primaryDiagnosis.trim() && (
          <div className="bg-accent/5 border border-accent/25 rounded-xl p-2.5">
            <span className="text-[10px] font-bold text-accent uppercase block mb-0.5">
              {isAr ? "التشخيص الأساسي" : "Primary Diagnosis"}
            </span>
            <p className="text-xs font-bold text-primary line-clamp-2">
              {assessment.primaryDiagnosis}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Sections */}
      {isOpen && (
        <div className="pt-3 border-t border-subtle/80 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* History */}
          {hasHistory && (
            <div className="space-y-1">
              <h5 className="font-bold text-primary flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted">
                <FileText className="h-3.5 w-3.5" />
                <span>{isAr ? "التاريخ المرضي والشكوى" : "Clinical History"}</span>
              </h5>
              <div className="bg-surface border border-subtle/50 rounded-xl p-3 space-y-2">
                {history.presentIllness.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "تاريخ الشكوى الحالية" : "History of Present Illness"}: </strong>
                    <span>{history.presentIllness}</span>
                  </div>
                )}
                {history.pastMedical.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "التاريخ السابق" : "Past Medical History"}: </strong>
                    <span>{history.pastMedical}</span>
                  </div>
                )}
                {history.drug.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "السجل الدوائي" : "Drug History"}: </strong>
                    <span>{history.drug}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vitals & Clinical Examination */}
          {(clinicalExamination.trim() || hasVitals) && (
            <div className="space-y-1">
              <h5 className="font-bold text-primary flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted">
                <Activity className="h-3.5 w-3.5" />
                <span>{isAr ? "الفحص والعلامات الحيوية" : "Examination & Vitals"}</span>
              </h5>
              <div className="bg-surface border border-subtle/50 rounded-xl p-3 space-y-2">
                {hasVitals && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-800 dark:text-slate-200 font-semibold border-b border-subtle pb-2 mb-2">
                    {vitals.heartRate && <span>HR: {vitals.heartRate} bpm</span>}
                    {vitals.bloodPressure && <span>BP: {vitals.bloodPressure} mmHg</span>}
                    {vitals.temperature && <span>Temp: {vitals.temperature} °C</span>}
                    {vitals.weight && <span>Weight: {vitals.weight} kg</span>}
                  </div>
                )}
                {clinicalExamination.trim() && (
                  <p className="whitespace-pre-wrap">{clinicalExamination}</p>
                )}
              </div>
            </div>
          )}

          {/* Investigations Requested */}
          {hasInvestigations && (
            <div className="space-y-1">
              <h5 className="font-bold text-primary flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{isAr ? "الفحوصات المطلوبة" : "Requested Investigations"}</span>
              </h5>
              <div className="bg-surface border border-subtle/50 rounded-xl p-3 space-y-2">
                {investigations.lab.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "تحاليل معملية" : "Lab tests"}: </strong>
                    <span>{investigations.lab}</span>
                  </div>
                )}
                {investigations.imaging.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "أشعة وفحوصات" : "Imaging"}: </strong>
                    <span>{investigations.imaging}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treatment plan */}
          {(treatmentPlan.notes.trim() || treatmentPlan.lifestyle.trim() || treatmentPlan.instructions.trim()) && (
            <div className="space-y-1">
              <h5 className="font-bold text-primary flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted">
                <ClipboardList className="h-3.5 w-3.5" />
                <span>{isAr ? "الخطة العلاجية والتعليمات" : "Treatment Plan & Advice"}</span>
              </h5>
              <div className="bg-surface border border-subtle/50 rounded-xl p-3 space-y-2">
                {treatmentPlan.notes.trim() && <p className="font-medium text-slate-800 dark:text-slate-200">{treatmentPlan.notes}</p>}
                {treatmentPlan.lifestyle.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "تعليمات نمط الحياة" : "Lifestyle advice"}: </strong>
                    <span>{treatmentPlan.lifestyle}</span>
                  </div>
                )}
                {treatmentPlan.instructions.trim() && (
                  <div>
                    <strong className="text-primary">· {isAr ? "تعليمات خاصة" : "Special instructions"}: </strong>
                    <span>{treatmentPlan.instructions}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prescriptions lines */}
          {prescribedLines.length > 0 && (
            <div className="space-y-1">
              <h5 className="font-bold text-primary flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted">
                <Heart className="h-3.5 w-3.5" />
                <span>{isAr ? "الروشتة الدوائية الملحقة" : "Attached Prescription"}</span>
              </h5>
              <div className="bg-surface border border-subtle/50 rounded-xl p-3">
                <table className="w-full text-start">
                  <thead>
                    <tr className="border-b border-subtle text-[10px] text-muted uppercase">
                      <th className="pb-1 text-start">{isAr ? "الدواء" : "Medicine"}</th>
                      <th className="pb-1 text-start">{isAr ? "الجرعة والمدة" : "Dose & Duration"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescribedLines.map((line, i) => (
                      <tr key={i} className="border-b border-subtle/50 last:border-b-0">
                        <td className="py-1.5 font-semibold text-primary">{line.medicineName}</td>
                        <td className="py-1.5 text-muted">
                          {line.doseAmount} {line.form} · {line.frequency} · {line.duration}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
