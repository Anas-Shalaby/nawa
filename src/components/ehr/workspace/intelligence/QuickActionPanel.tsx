"use client";

import { Calendar, DollarSign, UserCheck, Phone, FileText, Printer, UserX } from "lucide-react";

interface QuickActionPanelProps {
  phoneNumber: string;
  onSchedule: () => void;
  onPayment: () => void;
  onScrollToTimeline: () => void;
  onEditPatient: () => void;
  onPrintFile: () => void;
  locale: string;
}

export function QuickActionPanel({
  phoneNumber,
  onSchedule,
  onPayment,
  onScrollToTimeline,
  onEditPatient,
  onPrintFile,
  locale,
}: QuickActionPanelProps) {
  const isAr = locale === "ar";

  const actions = [
    {
      label: isAr ? "جدولة موعد متابعة" : "Schedule Follow-up",
      icon: Calendar,
      onClick: onSchedule,
      bg: "bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white",
    },
    {
      label: isAr ? "تسجيل دفعة نقدية" : "Record Payment",
      icon: DollarSign,
      onClick: onPayment,
      bg: "bg-accent-success/10 border-accent-success/20 text-accent-success hover:bg-accent-success hover:text-white",
    },
    {
      label: isAr ? "استعراض ملف الزيارة السابقة" : "Open Last Visit",
      icon: UserCheck,
      onClick: onScrollToTimeline,
      bg: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white",
    },
    {
      label: isAr ? "تعديل المريض" : "Edit Patient Profile",
      icon: FileText,
      onClick: onEditPatient,
      bg: "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-500 hover:text-white",
    },
    {
      label: isAr ? "طباعة الملف الطبي" : "Print File Summary",
      icon: Printer,
      onClick: onPrintFile,
      bg: "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400 hover:bg-slate-500 hover:text-white",
    },
  ];

  return (
    <div className="space-y-2.5 hide-on-print text-start">
      <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
        {isAr ? "إجراءات سريعة فورية" : "Contextual Quick Actions"}
      </h3>
      <div className="flex flex-wrap gap-2.5">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={act.onClick}
              className={`inline-flex items-center gap-1.5 border rounded-xl px-3.5 py-2 text-xs font-semibold transition duration-200 ${act.bg}`}
            >
              <Icon className="h-4 w-4" />
              <span>{act.label}</span>
            </button>
          );
        })}

        {/* Call Action */}
        <a
          href={`tel:${phoneNumber}`}
          className="inline-flex items-center gap-1.5 border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl px-3.5 py-2 text-xs font-semibold transition duration-200"
        >
          <Phone className="h-4 w-4" />
          <span>{isAr ? "اتصال بالمريض" : "Call Patient"}</span>
        </a>
      </div>
    </div>
  );
}
