"use client";

import { memo, type HTMLAttributes } from "react";
import { useTranslations } from "next-intl";
import { Phone, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Appointment, AppointmentStatus, FloorZone } from "@/lib/dashboard/types";
import { QueueStatusSelect } from "@/components/dashboard/QueueStatusSelect";
import { waitSeverity } from "@/lib/dashboard/missionControlSelectors";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";

interface PatientQuickActionsProps {
  appointment: Appointment;
  canManageQueue: boolean;
  onStatusChange: (status: AppointmentStatus) => void;
  isUpdating: boolean;
  primaryLabel: string;
  onPrimary?: () => void;
}

export function PatientQuickActions({
  appointment,
  canManageQueue,
  onStatusChange,
  isUpdating,
  primaryLabel,
  onPrimary,
}: PatientQuickActionsProps) {
  const t = useTranslations("dashboard.commandCenter.card");

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-subtle/80 pt-2">
      {canManageQueue && onPrimary ? (
        <button
          type="button"
          disabled={isUpdating}
          onClick={onPrimary}
          className="inline-flex h-8 items-center rounded-lg bg-accent px-2.5 text-[11px] font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
        >
          {primaryLabel}
        </button>
      ) : null}
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

function primaryForZone(
  zone: FloorZone,
): { status: AppointmentStatus; labelKey: "checkIn" | "start" | "complete" } | null {
  if (zone === "outside") return { status: "checked_in", labelKey: "checkIn" };
  if (zone === "waiting") return { status: "in_session", labelKey: "start" };
  if (zone === "doctor") return { status: "completed", labelKey: "complete" };
  return null;
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
  const severity = zone === "waiting" ? waitSeverity(waitMinutes) : "neutral";
  const timerMinutes = zone === "doctor" ? consultMinutes : waitMinutes;
  const primary = primaryForZone(zone);

  return (
    <article
      className={[
        "rounded-xl border bg-surface p-3 shadow-sm transition-shadow",
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
      <div className="flex items-start gap-2.5">
        {dragHandleProps ? (
          <div
            {...dragHandleProps}
            className="mt-1 shrink-0 cursor-grab text-muted active:cursor-grabbing"
            aria-label={t("floor.dragHandle")}
          />
        ) : null}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-[11px] font-bold text-primary">
          {initials(appointment.patientName)}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary">
                {appointment.patientName}
              </p>
              <p className="truncate text-xs text-muted">
                {appointment.serviceName}
                {" · "}
                {formatAppointmentTime(appointment.appointmentDate, locale)}
              </p>
            </div>
            {(zone === "waiting" || zone === "doctor") && (
              <p
                className={[
                  "shrink-0 text-xs font-medium tabular-nums",
                  severity === "danger"
                    ? "text-accent-danger"
                    : severity === "warning"
                      ? "text-accent-warning"
                      : "text-muted",
                ].join(" ")}
              >
                {zone === "doctor"
                  ? tc("consultMins", { mins: timerMinutes })
                  : tc("waitMins", { mins: timerMinutes })}
              </p>
            )}
          </div>

          <PatientQuickActions
            appointment={appointment}
            canManageQueue={canManageQueue}
            onStatusChange={onStatusChange}
            isUpdating={busy}
            primaryLabel={primary ? tc(`primary.${primary.labelKey}`) : ""}
            onPrimary={
              primary ? () => onStatusChange(primary.status) : undefined
            }
          />
        </div>
      </div>
    </article>
  );
});
