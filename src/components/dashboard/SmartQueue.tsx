"use client";

import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { Users } from "lucide-react";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import type { QueueAppointment } from "@/lib/dashboard/types";
import { QueueRow } from "./QueueRow";

interface SmartQueueProps {
  appointments: QueueAppointment[];
  selectedId: string | null;
  updatingId: string | null;
  onSelect: (appointment: QueueAppointment) => void;
  onStatusChange: (appointment: QueueAppointment, status: AppointmentStatus) => void;
}

export function SmartQueue({
  appointments,
  selectedId,
  updatingId,
  onSelect,
  onStatusChange,
}: SmartQueueProps) {
  const t = useTranslations("dashboard.queue");
  const locale = useLocale();

  const sorted = [...appointments].sort(
    (a, b) =>
      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
  );

  return (
    <section
      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-subtle/50 bg-surface/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      aria-label={t("listLabel")}
    >
      <header className="flex items-center justify-between gap-3 border-b border-subtle/60 bg-base/30 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3 text-start">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
            <Users className="h-5 w-5 text-accent" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-primary">{t("title")}</h2>
            <p className="mt-0.5 text-sm text-muted">{t("count", { count: sorted.length })}</p>
          </div>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold tabular-nums text-accent">
          {sorted.length}
        </span>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle/30 text-muted">
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <p className="max-w-[220px] text-sm leading-relaxed text-muted">{t("empty")}</p>
        </div>
      ) : (
        <LayoutGroup id={`queue-${locale}`}>
          <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:gap-3.5 sm:p-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {sorted.map((appointment) => (
                <QueueRow
                  key={appointment.id}
                  appointment={appointment}
                  isSelected={selectedId === appointment.id}
                  isUpdating={updatingId === appointment.id}
                  onSelect={onSelect}
                  onStatusChange={onStatusChange}
                />
              ))}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      )}
    </section>
  );
}
