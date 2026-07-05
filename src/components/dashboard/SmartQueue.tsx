"use client";

import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import type { Appointment, QueueAppointment } from "@/lib/dashboard/types";
import { QueueRow } from "./QueueRow";

interface SmartQueueProps {
  appointments: QueueAppointment[];
  selectedId: string | null;
  advancingId: string | null;
  onSelect: (appointment: QueueAppointment) => void;
  onAdvance: (appointment: QueueAppointment) => void;
}

export function SmartQueue({
  appointments,
  selectedId,
  advancingId,
  onSelect,
  onAdvance,
}: SmartQueueProps) {
  const t = useTranslations("dashboard.queue");
  const locale = useLocale();

  const sorted = [...appointments].sort(
    (a, b) =>
      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
  );

  return (
    <section
      className="flex h-full min-h-[420px] flex-col rounded-2xl border border-subtle bg-surface/50"
      aria-label={t("listLabel")}
    >
      <header className="border-b border-subtle px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-primary">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-muted">
          {t("count", { count: sorted.length })}
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <p className="text-sm text-muted">{t("empty")}</p>
        </div>
      ) : (
        <LayoutGroup id={`queue-${locale}`}>
          <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 sm:p-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {sorted.map((appointment) => (
                <QueueRow
                  key={appointment.id}
                  appointment={appointment}
                  isSelected={selectedId === appointment.id}
                  isAdvancing={advancingId === appointment.id}
                  onSelect={onSelect}
                  onAdvance={onAdvance}
                />
              ))}
            </AnimatePresence>
          </ul>
        </LayoutGroup>
      )}
    </section>
  );
}
