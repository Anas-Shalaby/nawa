"use client";

import { useMemo } from "react";
import { formatAppointmentDateLong } from "@/lib/datetime/cairo";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";

interface FollowUpCenterProps {
  visits: Array<{ id: string; appointmentDate: string; serviceName: string; status: string }>;
  locale: string;
  onScrollToTimeline: () => void;
}

export function FollowUpCenter({
  visits = [],
  locale,
  onScrollToTimeline,
}: FollowUpCenterProps) {
  const isAr = locale === "ar";

  const grouped = useMemo(() => {
    const upcoming: any[] = [];
    const missed: any[] = [];
    const completed: any[] = [];

    const now = Date.now();

    for (const v of visits) {
      const time = new Date(v.appointmentDate).getTime();
      const isActiveStatus = ["pending", "confirmed", "checked_in"].includes(v.status);

      if (v.status === "completed") {
        completed.push(v);
      } else if (isActiveStatus && time < now) {
        missed.push(v);
      } else if (isActiveStatus && time >= now) {
        upcoming.push(v);
      }
    }

    return {
      upcoming: upcoming.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()),
      missed: missed.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
      completed: completed.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
    };
  }, [visits]);

  return (
    <div className="bg-surface border border-subtle/80 rounded-2xl p-5 shadow-sm space-y-4 text-start hide-on-print">
      
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
          {isAr ? "مركز متابعة المواعيد" : "Follow-Up Center"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Missed / Overdue Follow-ups */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-accent-danger flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>{isAr ? "متابعات فائتة" : "Missed / Overdue"}</span>
            {grouped.missed.length > 0 && (
              <span className="bg-accent-danger/10 text-accent-danger text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                {grouped.missed.length}
              </span>
            )}
          </h4>
          {grouped.missed.length === 0 ? (
            <p className="text-[11px] text-muted italic p-2 bg-surface/50 border border-subtle/40 rounded-xl">
              {isAr ? "لا توجد مواعيد فائتة" : "No missed appointments"}
            </p>
          ) : (
            <ul className="space-y-2">
              {grouped.missed.map((v) => (
                <li
                  key={v.id}
                  onClick={onScrollToTimeline}
                  className="bg-accent-danger/5 border border-accent-danger/15 rounded-xl p-2.5 cursor-pointer hover:bg-accent-danger/10 transition text-xs"
                >
                  <p className="font-bold text-primary truncate">{v.serviceName}</p>
                  <p className="text-muted mt-0.5">{formatAppointmentDateLong(v.appointmentDate, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. Upcoming Follow-ups */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-accent flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{isAr ? "مواعيد قادمة" : "Upcoming Scheduled"}</span>
            {grouped.upcoming.length > 0 && (
              <span className="bg-accent/10 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto">
                {grouped.upcoming.length}
              </span>
            )}
          </h4>
          {grouped.upcoming.length === 0 ? (
            <p className="text-[11px] text-muted italic p-2 bg-surface/50 border border-subtle/40 rounded-xl">
              {isAr ? "غير مجدول لمواعيد قادمة" : "No upcoming scheduled"}
            </p>
          ) : (
            <ul className="space-y-2">
              {grouped.upcoming.map((v) => (
                <li
                  key={v.id}
                  onClick={onScrollToTimeline}
                  className="bg-accent/5 border border-accent/15 rounded-xl p-2.5 cursor-pointer hover:bg-accent/10 transition text-xs"
                >
                  <p className="font-bold text-primary truncate">{v.serviceName}</p>
                  <p className="text-muted mt-0.5">{formatAppointmentDateLong(v.appointmentDate, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Completed Follow-ups */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-accent-success flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>{isAr ? "متابعات مكتملة" : "Completed Sessions"}</span>
          </h4>
          {grouped.completed.length === 0 ? (
            <p className="text-[11px] text-muted italic p-2 bg-surface/50 border border-subtle/40 rounded-xl">
              {isAr ? "لا توجد زيارات مكتملة" : "No completed sessions"}
            </p>
          ) : (
            <ul className="space-y-2">
              {grouped.completed.slice(0, 3).map((v) => (
                <li
                  key={v.id}
                  onClick={onScrollToTimeline}
                  className="bg-accent-success/5 border border-accent-success/15 rounded-xl p-2.5 cursor-pointer hover:bg-accent-success/10 transition text-xs"
                >
                  <p className="font-bold text-primary truncate">{v.serviceName}</p>
                  <p className="text-muted mt-0.5">{formatAppointmentDateLong(v.appointmentDate, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

    </div>
  );
}
