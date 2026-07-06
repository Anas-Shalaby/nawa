"use client";

import { forwardRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import { getQueueStatusColor } from "@/lib/dashboard/queueStateMachine";
import type { QueueAppointment } from "@/lib/dashboard/types";
import { QueueStatusSelect } from "./QueueStatusSelect";

interface QueueRowProps {
  appointment: QueueAppointment;
  isSelected: boolean;
  isUpdating: boolean;
  onSelect: (appointment: QueueAppointment) => void;
  onStatusChange: (appointment: QueueAppointment, status: AppointmentStatus) => void;
}

export const QueueRow = forwardRef<HTMLLIElement, QueueRowProps>(function QueueRow(
  {
    appointment,
    isSelected,
    isUpdating,
    onSelect,
    onStatusChange,
  },
  ref,
) {
  const tDash = useTranslations("dashboard");
  const locale = useLocale() as Locale;

  const statusColor = getQueueStatusColor(appointment.status);
  const timeLabel = formatAppointmentTime(appointment.appointmentDate, locale);

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
        "group rounded-2xl border transition-all duration-200",
        isSelected
          ? "border-accent/50 bg-accent/[0.06] shadow-[0_0_0_1px_rgba(108,92,231,0.15)]"
          : "border-subtle/50 bg-base/40 hover:border-subtle hover:bg-surface/60",
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
        className="flex cursor-pointer items-center gap-4 p-4 sm:gap-5 sm:p-5"
      >
        <div
          className="flex h-[4.5rem] w-[5rem] shrink-0 items-center justify-center rounded-xl border px-1.5 text-center sm:h-20 sm:w-[5.5rem]"
          style={{
            borderColor: `${statusColor}33`,
            backgroundColor: `${statusColor}12`,
          }}
        >
          <span className="text-xs font-bold leading-tight tabular-nums sm:text-sm" style={{ color: statusColor }}>
            {timeLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-lg font-semibold text-primary">{appointment.patientName}</p>
            {appointment.noShowCount > 0 ? (
              <span className="rounded-full bg-accent-danger/10 px-2.5 py-1 text-xs font-medium text-accent-danger">
                {strikeLabel}
              </span>
            ) : null}
          </div>
          <p className="truncate text-base text-muted">{appointment.serviceName}</p>
        </div>

        <QueueStatusSelect
          value={appointment.status}
          isUpdating={isUpdating}
          onChange={(status) => onStatusChange(appointment, status)}
        />
      </div>
    </motion.li>
  );
});
