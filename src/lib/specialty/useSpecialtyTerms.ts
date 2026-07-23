"use client";

import { useMemo } from "react";
import { useSpecialty } from "./SpecialtyContext";

interface SpecialtyTerms {
  visit: string;
  session: string;
  finishVisit: string;
  todaysVisits: string;
  visitNotes: string;
  startVisit: string;
  noActiveVisit: string;
  currentSession: string;
  nextSession: string;
  sessionTimeline: string;
}

export function useSpecialtyTerms(locale: string): SpecialtyTerms {
  const { isPsychiatry } = useSpecialty();
  const isAr = locale === "ar";

  return useMemo(() => {
    if (isPsychiatry) {
      return {
        visit: isAr ? "جلسة" : "Session",
        session: isAr ? "جلسة" : "Session",
        finishVisit: isAr ? "إنهاء الجلسة" : "Finish Session",
        todaysVisits: isAr ? "جلسات اليوم" : "Today's Sessions",
        visitNotes: isAr ? "ملاحظات الجلسة" : "Session Notes",
        startVisit: isAr ? "بدء الجلسة" : "Start Session",
        noActiveVisit: isAr ? "لا توجد جلسة اليوم" : "No session scheduled today",
        currentSession: isAr ? "الجلسة الحالية" : "Current Session",
        nextSession: isAr ? "الجلسة القادمة" : "Next Session",
        sessionTimeline: isAr ? "سجل الجلسات" : "Session Timeline",
      };
    }

    return {
      visit: isAr ? "كشف" : "Visit",
      session: isAr ? "كشف" : "Visit",
      finishVisit: isAr ? "إنهاء الكشف" : "Finish Visit",
      todaysVisits: isAr ? "كشوفات اليوم" : "Today's Visits",
      visitNotes: isAr ? "ملاحظات الكشف" : "Visit Notes",
      startVisit: isAr ? "بدء الكشف" : "Start Visit",
      noActiveVisit: isAr ? "لا يوجد كشف اليوم" : "No visit on today's schedule",
      currentSession: isAr ? "الكشف الحالي" : "Current Visit",
      nextSession: isAr ? "الموعد القادم" : "Next Appointment",
      sessionTimeline: isAr ? "الخط الزمني" : "Timeline",
    };
  }, [isPsychiatry, isAr]);
}
