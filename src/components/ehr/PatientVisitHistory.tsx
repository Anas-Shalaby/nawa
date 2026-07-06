"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CalendarDays, ClipboardList, Loader2 } from "lucide-react";
import { getPatientVisitHistory } from "@/actions/fetchPatientVisitHistory";
import {
  formatAppointmentDateLong,
  formatAppointmentTime,
} from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-status-pending/15", text: "text-status-pending" },
  confirmed: { bg: "bg-status-confirmed/15", text: "text-status-confirmed" },
  checked_in: { bg: "bg-status-checkedIn/15", text: "text-status-checkedIn" },
  in_session: { bg: "bg-accent/15", text: "text-accent" },
  completed: { bg: "bg-status-completed/15", text: "text-status-completed" },
  no_show: { bg: "bg-accent-danger/15", text: "text-accent-danger" },
  canceled: { bg: "bg-muted/15", text: "text-muted" },
};

interface PatientVisitHistoryProps {
  patientId: string;
  initialVisits?: PatientVisitRecord[];
  enabled?: boolean;
  compact?: boolean;
}

export function PatientVisitHistory({
  patientId,
  initialVisits,
  enabled = true,
  compact = false,
}: PatientVisitHistoryProps) {
  const t = useTranslations("ehr.visitRecord");
  const tStatus = useTranslations("dashboard.detail.status");
  const locale = useLocale() as Locale;
  const [visits, setVisits] = useState<PatientVisitRecord[]>(initialVisits ?? []);
  const [loading, setLoading] = useState(!initialVisits && enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialVisits) {
      setVisits(initialVisits);
      setLoading(false);
      return;
    }

    if (!enabled) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await getPatientVisitHistory(patientId);
        if (!cancelled) {
          setVisits(data);
        }
      } catch {
        if (!cancelled) {
          setError(t("loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [patientId, initialVisits, enabled]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-6 text-center text-sm text-accent-danger">
        {error}
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-subtle px-6 py-10 text-center">
        <ClipboardList className="mb-3 h-8 w-8 text-muted" aria-hidden />
        <p className="text-sm font-medium text-primary">{t("emptyTitle")}</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-start">
        <div>
          <p className="text-sm font-semibold text-primary">{t("title")}</p>
          <p className="mt-0.5 text-xs text-muted">{t("subtitle", { count: visits.length })}</p>
        </div>
        <span className="rounded-full border border-subtle bg-base/50 px-3 py-1 text-xs font-medium text-muted">
          {t("totalVisits", { count: visits.length })}
        </span>
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-subtle md:block">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-subtle bg-base/40 text-xs text-muted">
              <th className="px-4 py-3 font-medium">{t("colDate")}</th>
              <th className="px-4 py-3 font-medium">{t("colService")}</th>
              <th className="px-4 py-3 font-medium">{t("colType")}</th>
              <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
              <th className="px-4 py-3 font-medium">{t("colNotes")}</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit, index) => {
              const statusStyle = STATUS_STYLES[visit.status];

              return (
                <motion.tr
                  key={visit.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="border-b border-subtle/60 last:border-0"
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-primary">
                      {formatAppointmentDateLong(visit.appointmentDate, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatAppointmentTime(visit.appointmentDate, locale)}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-primary">{visit.serviceName}</p>
                    {visit.priceEgp !== null ? (
                      <p className="mt-0.5 text-xs text-muted">
                        {t("priceValue", { amount: visit.priceEgp.toLocaleString() })}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        visit.isReExamination
                          ? "bg-accent-warning/15 text-accent-warning"
                          : "bg-accent/10 text-accent",
                      ].join(" ")}
                    >
                      {visit.isReExamination ? t("visitReExam") : t("visitFirst")}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        statusStyle.bg,
                        statusStyle.text,
                      ].join(" ")}
                    >
                      {tStatus(visit.status)}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 align-top text-xs leading-relaxed text-muted">
                    {visit.doctorNotes?.trim() ? visit.doctorNotes : t("noNotes")}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {visits.map((visit, index) => {
          const statusStyle = STATUS_STYLES[visit.status];

          return (
            <motion.article
              key={visit.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              className="rounded-xl border border-subtle bg-base/40 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 text-start">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {formatAppointmentDateLong(visit.appointmentDate, locale)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatAppointmentTime(visit.appointmentDate, locale)}
                    </p>
                  </div>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
                    statusStyle.bg,
                    statusStyle.text,
                  ].join(" ")}
                >
                  {tStatus(visit.status)}
                </span>
              </div>

              <div className="space-y-2 text-start text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{t("colService")}</span>
                  <span className="font-medium text-primary">{visit.serviceName}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{t("colType")}</span>
                  <span className="font-medium text-primary">
                    {visit.isReExamination ? t("visitReExam") : t("visitFirst")}
                  </span>
                </div>
                {!compact && visit.doctorNotes?.trim() ? (
                  <div className="rounded-lg border border-subtle/60 bg-surface/50 px-3 py-2">
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">
                      {t("colNotes")}
                    </p>
                    <p className="text-sm leading-relaxed text-primary">{visit.doctorNotes}</p>
                  </div>
                ) : null}
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
