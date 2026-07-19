"use client";

import { ReactNode } from "react";
import { 
  Calendar, 
  Stethoscope, 
  FileText, 
  Image as ImageIcon, 
  DollarSign, 
  XCircle, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  ClipboardList
} from "lucide-react";

interface TimelineEventCardProps {
  kind: "visit" | "prescription" | "payment" | "media" | "followup" | "cancellation" | "no_show" | "investigation" | "appointment";
  title: string;
  dateLabel: string;
  doctorName?: string | null;
  highlightTag?: string | null;
  children?: ReactNode;
  locale: string;
}

export function TimelineEventCard({
  kind,
  title,
  dateLabel,
  doctorName,
  highlightTag,
  children,
  locale,
}: TimelineEventCardProps) {
  const isAr = locale === "ar";

  // Icons and Tones based on Kind
  const config = {
    visit: {
      icon: Stethoscope,
      bg: "bg-accent/10 border-accent/20",
      iconColor: "text-accent",
    },
    prescription: {
      icon: FileText,
      bg: "bg-accent-success/10 border-accent-success/20",
      iconColor: "text-accent-success",
    },
    payment: {
      icon: DollarSign,
      bg: "bg-accent-success/10 border-accent-success/20",
      iconColor: "text-accent-success",
    },
    media: {
      icon: ImageIcon,
      bg: "bg-purple-500/10 border-purple-500/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    followup: {
      icon: Calendar,
      bg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    cancellation: {
      icon: XCircle,
      bg: "bg-accent-danger/10 border-accent-danger/20",
      iconColor: "text-accent-danger",
    },
    no_show: {
      icon: AlertTriangle,
      bg: "bg-accent-danger/10 border-accent-danger/20",
      iconColor: "text-accent-danger",
    },
    investigation: {
      icon: ClipboardList,
      bg: "bg-indigo-500/10 border-indigo-500/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    appointment: {
      icon: Clock,
      bg: "bg-slate-500/10 border-slate-500/20",
      iconColor: "text-slate-600 dark:text-slate-400",
    },
  }[kind] || {
    icon: Calendar,
    bg: "bg-slate-500/10 border-slate-500/20",
    iconColor: "text-slate-600 dark:text-slate-400",
  };

  const IconComponent = config.icon;

  return (
    <div className={`relative border-s-2 border-subtle/70 ps-6 pb-8 last:pb-2 text-start`}>
      
      {/* Icon Node on Vertical Line */}
      <span className={`absolute -start-[15px] top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface shadow-sm ${config.bg}`}>
        <IconComponent className={`h-3.5 w-3.5 ${config.iconColor}`} />
      </span>

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pt-0.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wide">
              {isAr ? {
                visit: "زيارة كشف",
                prescription: "روشتة علاجية",
                payment: "تحصيل مالي",
                media: "أشعة وملفات",
                followup: "استشارة متابعة",
                cancellation: "زيارة ملغاة",
                no_show: "غياب عن الموعد",
                investigation: "فحوصات وطلب تحاليل",
                appointment: "حجز موعد",
              }[kind] : kind.replace("_", " ")}
            </span>
            {highlightTag && (
              <span className="inline-flex items-center gap-1 rounded bg-accent-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-accent-danger uppercase">
                {highlightTag}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-primary mt-0.5">{title}</h3>
        </div>
        <div className="text-end">
          <p className="text-[10px] font-medium text-muted">{dateLabel}</p>
          {doctorName && (
            <p className="text-[10px] text-muted/80 mt-0.5 font-medium">
              {isAr ? "بواسطة " : "By "} {doctorName}
            </p>
          )}
        </div>
      </div>

      {/* Embedded Event Child Card */}
      {children && <div className="mt-2.5">{children}</div>}

    </div>
  );
}
