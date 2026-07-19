"use client";

import { AlertTriangle, CreditCard, Calendar, Activity, ShieldAlert, Sparkles } from "lucide-react";

interface VisitInsightsProps {
  balanceDue: number;
  noShowCount: number;
  lastVisitDate: string | null;
  visits: Array<{ status: string; appointmentDate: string; doctorNotes: string | null }>;
  allergies: string[];
  chronicDiseases: string[];
  locale: string;
}

export function VisitInsights({
  balanceDue,
  noShowCount,
  lastVisitDate,
  visits = [],
  allergies = [],
  chronicDiseases = [],
  locale,
}: VisitInsightsProps) {
  const isAr = locale === "ar";
  const insights: Array<{
    type: "warning" | "danger" | "info";
    icon: any;
    title: string;
    description: string;
  }> = [];

  // 1. Outstanding payment insight
  if (balanceDue > 0) {
    insights.push({
      type: "danger",
      icon: CreditCard,
      title: isAr ? "مديونية معلقة مستحقة" : "Outstanding Balance Alert",
      description: isAr
        ? `المريض لديه مبالغ متأخرة مستحقة الدفع بقيمة ${balanceDue} ج.م. يرجى مراجعة الحسابات.`
        : `Patient has outstanding unpaid dues of ${balanceDue} EGP. Please check payments.`,
    });
  }

  // 2. Patient missed last two appointments
  // Sort visits descending to look at the most recent ones
  const sortedVisits = [...visits].sort(
    (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );
  if (sortedVisits.length >= 2) {
    const lastTwo = sortedVisits.slice(0, 2);
    if (lastTwo.every((v) => v.status === "no_show")) {
      insights.push({
        type: "danger",
        icon: AlertTriangle,
        title: isAr ? "تغيب متكرر عن المواعيد" : "Multiple Consecutive No-Shows",
        description: isAr
          ? "تغيب المريض عن آخر موعدين محجوزين له متتاليين."
          : "Patient missed their last two consecutively scheduled appointments.",
      });
    }
  }

  // 3. No completed visit in more than one year (Dormant Patient)
  const completedVisits = sortedVisits.filter((v) => v.status === "completed");
  if (completedVisits.length > 0) {
    const lastCompleted = completedVisits[0];
    const diffTime = Date.now() - new Date(lastCompleted.appointmentDate).getTime();
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
    if (diffYears >= 1) {
      insights.push({
        type: "warning",
        icon: Calendar,
        title: isAr ? "انقطاع عن المتابعة لأكثر من عام" : "Over 1 Year Since Last Completed Visit",
        description: isAr
          ? `آخر كشف مكتمل للمريض كان بتاريخ ${new Date(lastCompleted.appointmentDate).toLocaleDateString(isAr ? "ar-EG" : "en-US")}.`
          : `The last completed consultation was on ${new Date(lastCompleted.appointmentDate).toLocaleDateString("en-US")}.`,
      });
    }
  }

  // 4. Same complaint keyword in the last three completed visits
  if (completedVisits.length >= 3) {
    const lastThreeComplaints: string[] = [];
    for (const v of completedVisits.slice(0, 3)) {
      if (v.doctorNotes) {
        try {
          const parsed = JSON.parse(v.doctorNotes);
          if (parsed && parsed.version === "sprint3" && parsed.chiefComplaint) {
            lastThreeComplaints.push(parsed.chiefComplaint.trim().toLowerCase());
          }
        } catch (e) {
          lastThreeComplaints.push(v.doctorNotes.trim().toLowerCase());
        }
      }
    }

    if (lastThreeComplaints.length === 3) {
      // Find common keywords (e.g. fever, pain, cough)
      const words = lastThreeComplaints[0].split(/\s+/).filter(w => w.length > 3);
      let commonWord = "";
      for (const w of words) {
        if (lastThreeComplaints[1].includes(w) && lastThreeComplaints[2].includes(w)) {
          commonWord = w;
          break;
        }
      }
      if (commonWord) {
        insights.push({
          type: "warning",
          icon: Activity,
          title: isAr ? "شكوى مرضية متكررة" : "Repeated Complaint Keyword",
          description: isAr
            ? `تكررت كلمة الشكوى "${commonWord}" في آخر 3 زيارات متتالية للمريض. يرجى التقصي الإضافي.`
            : `The symptom keyword "${commonWord}" appeared in the patient's last 3 consecutive visits.`,
        });
      }
    }
  }

  // 5. Chronic disease registered
  if (chronicDiseases.length > 0) {
    insights.push({
      type: "info",
      icon: Activity,
      title: isAr ? "حالة مرضية مزمنة مسجلة" : "Chronic Disease Registered",
      description: isAr
        ? `المريض مسجل لديه أمراض مزمنة: ${chronicDiseases.join("، ")}.`
        : `Patient is managed for chronic conditions: ${chronicDiseases.join(", ")}.`,
    });
  }

  // 6. Allergy alert
  if (allergies.length > 0) {
    insights.push({
      type: "warning",
      icon: ShieldAlert,
      title: isAr ? "تنبيه حساسية علاجية" : "Known Drug Allergy",
      description: isAr
        ? `المريض يعاني من حساسية تجاه: ${allergies.join("، ")}.`
        : `Patient has documented allergies: ${allergies.join(", ")}.`,
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="space-y-2.5 hide-on-print">
      <h3 className="text-xs font-bold text-muted uppercase tracking-wider text-start">
        {isAr ? "رؤى وتنبيهات الكشف الحالية" : "Clinical Insights & Alerts"}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const style = {
            danger: "bg-accent-danger/5 border-accent-danger/25 text-accent-danger",
            warning: "bg-accent/5 border-accent/25 text-accent",
            info: "bg-accent-success/5 border-accent-success/20 text-accent-success",
          }[ins.type];

          return (
            <div
              key={i}
              className={`flex items-start gap-3 border rounded-2xl p-4 text-start transition duration-200 ${style}`}
            >
              <span className="p-2 rounded-xl bg-current/5 flex-shrink-0">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">{ins.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                  {ins.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
