"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import { Play, Search, UserPlus, UserRoundPlus, Calendar, Clock, Sparkles } from "lucide-react";
import type { Appointment } from "@/lib/dashboard/types";
import type { Locale } from "@/i18n/routing";

interface PsychiatryOsDashboardProps {
  appointments: Appointment[];
  clinicName: string;
  doctorName: string;
  dateLabel: string;
  locale: Locale;
  busy: boolean;
  onStatusChange: (appointment: Appointment, status: any) => void;
  onAddWalkIn: () => void;
  onSearchClick: () => void;
  onNewPatientClick: () => void;
}

export function PsychiatryOsDashboard({
  appointments,
  clinicName,
  doctorName,
  dateLabel,
  locale,
  busy,
  onStatusChange,
  onAddWalkIn,
  onSearchClick,
  onNewPatientClick,
}: PsychiatryOsDashboardProps) {
  const isAr = locale === "ar";

  // Filter sessions
  const currentSession = useMemo(
    () => appointments.find((a) => a.status === "in_session") ?? null,
    [appointments]
  );

  const waitingPatients = useMemo(
    () => appointments.filter((a) => a.status === "checked_in"),
    [appointments]
  );

  const upcomingSessions = useMemo(
    () => appointments.filter((a) => a.status === "pending" || a.status === "confirmed"),
    [appointments]
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments]
  );

  const followUps = useMemo(
    () => appointments.filter((a) => a.isFollowUp),
    [appointments]
  );

  // Next up (either first waiting patient, or first upcoming appointment)
  const nextUp = useMemo(() => {
    if (waitingPatients.length > 0) return waitingPatients[0];
    if (upcomingSessions.length > 0) return upcomingSessions[0];
    return null;
  }, [waitingPatients, upcomingSessions]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 space-y-10 text-start font-sans">
      
      {/* 1. Calm Header */}
      <header className="space-y-2 border-b border-subtle pb-6">
        <h1 className="text-4xl font-light tracking-tight text-primary">
          {isAr ? `أهلاً بك، د. ${doctorName}` : `Welcome, Dr. ${doctorName}`}
        </h1>
        <p className="text-sm text-muted">
          {clinicName} · {dateLabel} · {isAr ? `${appointments.length} جلسة مجدولة اليوم (${completedCount} مكتملة)` : `${appointments.length} sessions scheduled today (${completedCount} completed)`}
        </p>
      </header>

      {/* 2. Primary Actions Row */}
      <div className="flex flex-wrap gap-3">
        {nextUp && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(nextUp, "in_session")}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <Play className="h-4.5 w-4.5 fill-current" />
            <span>{isAr ? "بدء الجلسة التالية" : "Start Next Session"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSearchClick}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-subtle bg-surface px-5 text-sm font-medium text-primary transition hover:border-accent/40"
        >
          <Search className="h-4 w-4" />
          <span>{isAr ? "بحث عن مريض" : "Search Patient"}</span>
        </button>

        <button
          type="button"
          onClick={onNewPatientClick}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-subtle bg-surface px-5 text-sm font-medium text-primary transition hover:border-accent/40"
        >
          <UserPlus className="h-4 w-4" />
          <span>{isAr ? "مريض جديد" : "New Patient"}</span>
        </button>

        <button
          type="button"
          onClick={onAddWalkIn}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-subtle bg-surface px-5 text-sm font-medium text-primary transition hover:border-accent/40"
        >
          <UserRoundPlus className="h-4 w-4" />
          <span>{isAr ? "حالة بدون حجز" : "Walk-in"}</span>
        </button>
      </div>

      {/* 3. Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Column 1: Current Session Focus Card */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
            {isAr ? "الجلسة النشطة الحالية" : "Current Active Session"}
          </h3>

          {currentSession ? (
            <div className="bg-surface border-2 border-accent/30 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-lg bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {isAr ? "جلسة قيد التنفيذ" : "Session in progress"}
                </span>
                <h2 className="text-4xl font-semibold tracking-tight text-primary leading-tight">
                  {currentSession.patientName}
                </h2>
                <p className="text-sm text-muted">
                  {currentSession.serviceName} · {isAr ? "بدأت منذ: " : "Started: "} {formatAppointmentTime(currentSession.appointmentDate, locale)}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/dashboard/patients/${currentSession.patientId}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                >
                  {isAr ? "فتح ملف الجلسة" : "Open Session Workspace"}
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStatusChange(currentSession, "completed")}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/5 px-6 text-sm font-semibold text-accent transition hover:bg-accent/10"
                >
                  {isAr ? "إنهاء الجلسة" : "Finish Session"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface/50 border border-dashed border-subtle rounded-3xl p-10 text-center space-y-3">
              <p className="text-muted text-sm">
                {isAr ? "لا توجد جلسات نشطة حالياً." : "No active session in progress."}
              </p>
              {nextUp ? (
                <p className="text-xs text-muted/80">
                  {isAr ? `الجلسة التالية لـ: ${nextUp.patientName}` : `Next session scheduled for: ${nextUp.patientName}`}
                </p>
              ) : null}
            </div>
          )}

          {/* Patients Waiting List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              {isAr ? "المرضى في الانتظار" : "Patients Waiting"}
              {waitingPatients.length > 0 && (
                <span className="ml-2 bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {waitingPatients.length}
                </span>
              )}
            </h3>

            {waitingPatients.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted bg-surface/30 border border-subtle/50 rounded-2xl italic">
                {isAr ? "لا يوجد مرضى في صالة الانتظار حالياً." : "No patients in the waiting area."}
              </p>
            ) : (
              <div className="space-y-2">
                {waitingPatients.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 p-4 bg-surface border border-subtle/70 rounded-2xl shadow-sm hover:border-subtle transition"
                  >
                    <div>
                      <p className="text-sm font-bold text-primary">{a.patientName}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {a.serviceName} · {isAr ? "تم تسجيل الدخول: " : "Checked in: "} {formatAppointmentTime(a.appointmentDate, locale)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onStatusChange(a, "in_session")}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl bg-accent px-4 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                    >
                      {isAr ? "بدء الجلسة" : "Start Session"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Upcoming Sessions & Today's Follow-ups */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center justify-between">
              <span>{isAr ? "الجلسات القادمة" : "Upcoming Sessions"}</span>
              <span className="text-[10px] font-medium normal-case text-muted/80">{upcomingSessions.length} total</span>
            </h3>

            {upcomingSessions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted bg-surface/30 border border-subtle/50 rounded-2xl italic">
                {isAr ? "لا توجد جلسات مجدولة قادمة اليوم." : "No upcoming sessions for today."}
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {upcomingSessions.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 bg-surface border border-subtle/60 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-primary truncate">{a.patientName}</span>
                      <span className="text-[10px] text-muted font-mono whitespace-nowrap">
                        {formatAppointmentTime(a.appointmentDate, locale)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{a.serviceName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Follow-ups stats */}
          <div className="bg-accent/5 border border-accent/15 rounded-2xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-accent uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{isAr ? "متابعات اليوم" : "Today's Follow-ups"}</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              {isAr
                ? `لديك ${followUps.length} حالة متابعة مجدولة اليوم من إجمالي الجلسات.`
                : `You have ${followUps.length} follow-up sessions scheduled today out of total bookings.`}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
