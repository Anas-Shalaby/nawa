"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Loader2 } from "lucide-react";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import {
  AGENDA_SELECTABLE_STATUSES,
  QUEUE_SELECTABLE_STATUSES,
  getQueueStatusColor,
} from "@/lib/dashboard/queueStateMachine";
import type { QueueVisibleStatus } from "@/lib/dashboard/queueStateMachine";

interface QueueStatusSelectProps {
  value: AppointmentStatus;
  disabled?: boolean;
  isUpdating?: boolean;
  compact?: boolean;
  allowedStatuses?: readonly QueueVisibleStatus[];
  onChange: (status: AppointmentStatus) => void;
}

export function QueueStatusSelect({
  value,
  disabled = false,
  isUpdating = false,
  compact = false,
  allowedStatuses,
  onChange,
}: QueueStatusSelectProps) {
  const t = useTranslations("dashboard.detail.status");
  const tQueue = useTranslations("dashboard.queue");
  const statusColor = getQueueStatusColor(value);
  const selectableStatuses = allowedStatuses ?? QUEUE_SELECTABLE_STATUSES;

  return (
    <div
      className="relative shrink-0"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {isUpdating ? (
        <span
          className={[
            "inline-flex items-center justify-center rounded-xl border border-subtle bg-base/80 text-muted",
            compact ? "h-9 w-9" : "h-10 min-w-[9.5rem] px-3",
          ].join(" ")}
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        </span>
      ) : (
        <>
          <select
            value={value}
            disabled={disabled}
            aria-label={tQueue("statusLabel")}
            onChange={(event) => onChange(event.target.value as AppointmentStatus)}
            className={[
              "cursor-pointer appearance-none rounded-xl border bg-base/90 text-start font-medium text-primary",
              "outline-none transition focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-9 min-w-[8.5rem] pe-8 ps-2.5 text-xs" : "h-10 min-w-[10rem] pe-9 ps-3 text-sm",
            ].join(" ")}
            style={{
              borderColor: `${statusColor}55`,
              backgroundImage: "none",
            }}
          >
            {selectableStatuses.map((status) => (
              <option key={status} value={status}>
                {t(status)}
              </option>
            ))}
            {!allowedStatuses && (
              <option value="no_show">{tQueue("noShowOption")}</option>
            )}
          </select>
          <ChevronDown
            className={[
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
              compact ? "end-2 h-3.5 w-3.5" : "end-2.5 h-4 w-4",
            ].join(" ")}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
