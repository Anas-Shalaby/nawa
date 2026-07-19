"use client";

import { formatAppointmentDateLong } from "@/lib/datetime/cairo";
import { FileText, Stethoscope, Heart, DollarSign } from "lucide-react";

interface RelatedHistoryProps {
  visits: Array<{ id: string; appointmentDate: string; serviceName: string; status: string; doctorNotes: string | null }>;
  prescriptions: Array<{ id: string; createdAt: string; lines: Array<{ medicineName: string }> }>;
  payments: Array<{ id: string; paidAt: string; amountPaid: number }>;
  locale: string;
}

export function RelatedHistory({
  visits = [],
  prescriptions = [],
  payments = [],
  locale,
}: RelatedHistoryProps) {
  const isAr = locale === "ar";

  // Inferences
  const completedVisits = visits.filter((v) => v.status === "completed");
  const lastVisit = completedVisits[0]; // Visits are sorted descending outside

  // Previous Diagnosis
  let prevDiag = "";
  if (lastVisit?.doctorNotes) {
    try {
      const parsed = JSON.parse(lastVisit.doctorNotes);
      if (parsed && parsed.version === "sprint3") {
        prevDiag = parsed.assessment?.primaryDiagnosis || "";
      }
    } catch (e) {
      // Legacy fallback
    }
  }

  // Last prescription
  const lastRx = prescriptions[0];

  // Last payment
  const lastPay = payments[0];

  const cards = [
    {
      title: isAr ? "الزيارة الأخيرة" : "Last Visit Summary",
      icon: Stethoscope,
      bg: "bg-accent/5 border-accent/15",
      iconCol: "text-accent",
      value: lastVisit
        ? `${lastVisit.serviceName} (${formatAppointmentDateLong(lastVisit.appointmentDate, locale)})`
        : null,
      hint: lastVisit?.doctorNotes
        ? (() => {
            try {
              const parsed = JSON.parse(lastVisit.doctorNotes);
              return parsed.version === "sprint3" ? parsed.chiefComplaint : lastVisit.doctorNotes;
            } catch (e) {
              return lastVisit.doctorNotes;
            }
          })()
        : null,
    },
    {
      title: isAr ? "التشخيص السابق" : "Previous Diagnosis",
      icon: FileText,
      bg: "bg-purple-500/5 border-purple-500/15",
      iconCol: "text-purple-600 dark:text-purple-400",
      value: prevDiag || (lastVisit ? (isAr ? "لم يوثق تشخيص محدد" : "No specific diagnosis documented") : null),
      hint: lastVisit ? (isAr ? "تم تسجيله في الكشف السابق" : "Recorded in the previous session") : null,
    },
    {
      title: isAr ? "آخر روشتة علاجية" : "Last Prescription Lines",
      icon: Heart,
      bg: "bg-accent-success/5 border-accent-success/15",
      iconCol: "text-accent-success",
      value: lastRx
        ? lastRx.lines.map((l) => l.medicineName).slice(0, 2).join(" , ") + (lastRx.lines.length > 2 ? "..." : "")
        : null,
      hint: lastRx
        ? `${isAr ? "تحتوي على" : "Contains"} ${lastRx.lines.length} ${isAr ? "أدوية" : "medicines"} (${formatAppointmentDateLong(lastRx.createdAt, locale)})`
        : null,
    },
    {
      title: isAr ? "آخر دفعة مسجلة" : "Last Cash Payment",
      icon: DollarSign,
      bg: "bg-slate-500/5 border-slate-500/15",
      iconCol: "text-slate-600 dark:text-slate-400",
      value: lastPay ? `${lastPay.amountPaid} ${isAr ? "ج.م" : "EGP"}` : null,
      hint: lastPay ? formatAppointmentDateLong(lastPay.paidAt, locale) : null,
    },
  ];

  // Filter out cards that don't have records
  const activeCards = cards.filter((c) => c.value !== null);

  if (activeCards.length === 0) return null;

  return (
    <div className="space-y-2.5 text-start hide-on-print">
      <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
        {isAr ? "ملخص المعاملات السابقة" : "Previous Interactions Summary"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`border rounded-2xl p-4 space-y-2 transition duration-200 flex flex-col justify-between ${c.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{c.title}</span>
                <span className={`p-1.5 rounded-lg bg-current/5 ${c.iconCol}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-1">
                <p className="text-xs font-bold text-primary truncate leading-tight" title={c.value!}>
                  {c.value}
                </p>
                {c.hint && (
                  <p className="text-[10px] text-muted/95 truncate mt-1">
                    {c.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
