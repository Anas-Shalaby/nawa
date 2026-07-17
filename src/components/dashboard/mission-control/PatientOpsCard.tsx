"use client";

import { memo, type HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { Phone, Printer, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Appointment, AppointmentStatus, FloorZone } from "@/lib/dashboard/types";
import { QueueStatusSelect } from "@/components/dashboard/QueueStatusSelect";
import {
  arrivalLabelKey,
  computePatientAge,
  genderLabelKey,
  resolvePaymentStatus,
  waitSeverity,
} from "@/lib/dashboard/missionControlSelectors";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";

interface PatientQuickActionsProps {
  appointment: Appointment;
  canManageQueue: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  isUpdating: boolean;
}

export function PatientQuickActions({
  appointment,
  canManageQueue,
  onStatusChange,
  isUpdating,
}: PatientQuickActionsProps) {
  const t = useTranslations("dashboard.commandCenter.card");

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-subtle/80 pt-2">
      <a
        href={`tel:${appointment.phoneNumber}`}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-subtle bg-elevated/60 text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        aria-label={t("call")}
      >
        <Phone className="h-3.5 w-3.5" aria-hidden />
      </a>
      <Link
        href={`/dashboard/patients/${appointment.patientId}`}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-subtle bg-elevated/60 text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        aria-label={t("profile")}
      >
        <User className="h-3.5 w-3.5" aria-hidden />
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-subtle bg-elevated/60 text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        aria-label={t("print")}
      >
        <Printer className="h-3.5 w-3.5" aria-hidden />
      </button>
      {canManageQueue ? (
        <QueueStatusSelect
          compact
          value={appointment.status}
          isUpdating={isUpdating}
          onChange={onStatusChange}
        />
      ) : null}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

interface PatientOpsCardProps {
  appointment: Appointment;
  zone: FloorZone;
  waitMinutes: number;
  consultMinutes: number;
  busy: boolean;
  locale: Locale;
  dragHandleProps?: HTMLAttributes<HTMLDivElement> | null;
  isDragging?: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  canManageQueue: boolean;
}

export const PatientOpsCard = memo(function PatientOpsCard({
  appointment,
  zone,
  waitMinutes,
  consultMinutes,
  busy,
  locale,
  dragHandleProps,
  isDragging = false,
  onStatusChange,
  canManageQueue,
}: PatientOpsCardProps) {
  const t = useTranslations("dashboard.commandCenter");
  const tc = useTranslations("dashboard.commandCenter.card");
  const age = computePatientAge(appointment.dateOfBirth);
  const payment = resolvePaymentStatus(appointment);
  const severity = zone === "waiting" ? waitSeverity(waitMinutes) : "neutral";
  const timerMinutes = zone === "doctor" ? consultMinutes : waitMinutes;

  const serviceColor = appointment.serviceColorCode ?? "#6C5CE7";

  return (
    <article
      className={[
        "rounded-xl border bg-surface p-2.5 shadow-sm transition-shadow",
        severity === "danger"
          ? "border-accent-danger"
          : severity === "warning"
            ? "border-accent-warning/60"
            : "border-subtle",
        isDragging ? "ring-2 ring-accent/30" : "hover:shadow-md",
        busy ? "opacity-60" : "",
      ].join(" ")}
      aria-busy={busy}
    >
      <div className="flex items-start gap-2">
        {dragHandleProps ? (
          <div
            {...dragHandleProps}
            className="mt-1 shrink-0 cursor-grab text-muted active:cursor-grabbing"
            aria-label={t("floor.dragHandle")}
          />
        ) : null}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: `${serviceColor}cc` }}
        >
          {initials(appointment.patientName)}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <div className="flex items-start justify-between gap-1">
            <p className="truncate text-sm font-semibold text-primary">
              {appointment.patientName}
            </p>
            {appointment.priority && appointment.priority !== "normal" ? (
              <span className="shrink-0 rounded-full bg-accent-danger/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-danger">
                {appointment.priority}
              </span>
            ) : null}
          </div>
          <p className="text-[10px] text-muted">
            {formatAppointmentTime(appointment.appointmentDate, locale)}
            {age != null ? ` · ${tc("age", { age })}` : ""}
            {appointment.gender && appointment.gender !== "unspecified"
              ? ` · ${tc(`gender.${genderLabelKey(appointment.gender)}`)}`
              : ""}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-medium text-primary"
              style={{ backgroundColor: `${serviceColor}22`, color: serviceColor }}
            >
              {appointment.serviceName}
            </span>
            {appointment.assignedStaffName ? (
              <span className="text-[9px] text-muted">{appointment.assignedStaffName}</span>
            ) : null}
            {appointment.arrivalSource ? (
              <span className="text-[9px] text-muted">
                {tc(`arrival.${arrivalLabelKey(appointment.arrivalSource)}`)}
              </span>
            ) : null}
          </div>
          {(zone === "waiting" || zone === "doctor") && (
            <p
              className={[
                "mt-1 text-[10px] tabular-nums",
                severity === "danger"
                  ? "font-semibold text-accent-danger"
                  : severity === "warning"
                    ? "text-accent-warning"
                    : "text-muted",
              ].join(" ")}
            >
              <time dateTime={new Date(Date.now() - timerMinutes * 60_000).toISOString()}>
                {zone === "doctor"
                  ? tc("consultMins", { mins: timerMinutes })
                  : tc("waitMins", { mins: timerMinutes })}
              </time>
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
            {payment !== "unknown" ? (
              <span
                className={[
                  "rounded-full px-1.5 py-0.5",
                  payment === "paid"
                    ? "bg-accent-success/15 text-accent-success"
                    : "bg-accent-warning/15 text-accent-warning",
                ].join(" ")}
              >
                {tc(`payment.${payment}`)}
              </span>
            ) : null}
            {appointment.isFollowUp ? (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-accent">
                {tc("followUp")}
              </span>
            ) : null}
            {appointment.insuranceProvider ? (
              <span className="rounded-full bg-elevated px-1.5 py-0.5 text-muted">
                {appointment.insuranceProvider}
              </span>
            ) : null}
          </div>
          <PatientQuickActions
            appointment={appointment}
            canManageQueue={canManageQueue}
            onStatusChange={onStatusChange}
            isUpdating={busy}
          />
        </div>
      </div>
    </article>
  );
});
