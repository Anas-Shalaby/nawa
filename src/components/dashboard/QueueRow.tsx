"use client";

import { forwardRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import {
  NEXT_QUEUE_STATUS,
  QUEUE_ACTION_BY_STATUS,
  getQueueStatusColor,
} from "@/lib/dashboard/queueStateMachine";
import type { QueueAppointment } from "@/lib/dashboard/types";

interface QueueRowProps {
  appointment: QueueAppointment;
  isSelected: boolean;
  isAdvancing: boolean;
  onSelect: (appointment: QueueAppointment) => void;
  onAdvance: (appointment: QueueAppointment) => void;
}

function formatTime(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export const QueueRow = forwardRef<HTMLLIElement, QueueRowProps>(function QueueRow(
  {
    appointment,
    isSelected,
    isAdvancing,
    onSelect,
    onAdvance,
  },
  ref,
) {
  const t = useTranslations("dashboard.queue");
  const tDash = useTranslations("dashboard");
  const locale = useLocale() as Locale;

  const actionKey = QUEUE_ACTION_BY_STATUS[appointment.status];
  const nextStatus = NEXT_QUEUE_STATUS[appointment.status];
  const statusColor = getQueueStatusColor(appointment.status);
  const isCompleted = appointment.status === "completed";

  const strikeLabel =
    appointment.noShowCount === 1
      ? tDash("strikes", { count: appointment.noShowCount })
      : tDash("strikesPlural", { count: appointment.noShowCount });

  return (
    <motion.li
      ref={ref}
      layout
      layoutId={appointment.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ layout: { type: "spring", stiffness: 380, damping: 32 } }}
      className={[
        "rounded-xl border bg-surface transition-colors",
        isSelected
          ? "border-accent/40 ring-1 ring-accent/20"
          : "border-subtle hover:border-zinc-600",
      ].join(" ")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(appointment)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(appointment);
          }
        }}
        className="flex cursor-pointer items-center gap-3 p-3 sm:gap-4 sm:p-4"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
              style={{
                backgroundColor: `${statusColor}18`,
                color: statusColor,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: statusColor }}
                aria-hidden
              />
              {formatTime(appointment.appointmentDate, locale)}
            </span>
            {appointment.noShowCount > 0 && (
              <span className="rounded-full bg-accent-danger/10 px-2 py-0.5 text-xs font-medium text-accent-danger">
                {strikeLabel}
              </span>
            )}
          </div>

          <p className="truncate text-base font-medium text-primary">
            {appointment.patientName}
          </p>

          <p className="truncate text-sm text-muted">{appointment.serviceName}</p>
        </div>

        <div className="shrink-0">
          {isCompleted ? (
            <span className="inline-flex items-center rounded-lg border border-subtle bg-base/60 px-3 py-2 text-xs font-medium text-muted">
              {t("statusCompleted")}
            </span>
          ) : actionKey && nextStatus ? (
            <button
              type="button"
              disabled={isAdvancing}
              onClick={(event) => {
                event.stopPropagation();
                onAdvance(appointment);
              }}
              className={[
                "inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg px-3 py-2",
                "text-sm font-medium text-white transition",
                "bg-accent hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {isAdvancing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t(`actions.${actionKey}`)}
            </button>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
});
