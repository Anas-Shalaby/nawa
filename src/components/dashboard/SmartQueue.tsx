"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, Users } from "lucide-react";
import { matchesPatientSearch } from "@/lib/patients/search";
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
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () =>
      [...appointments]
        .filter((appointment) =>
          matchesPatientSearch(
            {
              name: appointment.patientName,
              phoneNumber: appointment.phoneNumber,
            },
            search,
          ),
        )
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
    [appointments, search],
  );

  const hasAppointments = appointments.length > 0;
  const isSearching = search.trim().length > 0;

  return (
    <section
      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-subtle/50 bg-surface/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      aria-label={t("listLabel")}
    >
      <header className="border-b border-subtle/60 bg-base/30 px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
              <Users className="h-5 w-5 text-accent" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-primary">{t("title")}</h2>
              <p className="mt-0.5 text-sm text-muted">
                {t("count", { count: sorted.length })}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold tabular-nums text-accent">
            {sorted.length}
          </span>
        </div>

        {hasAppointments && (
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-subtle bg-surface py-2.5 ps-10 pe-4 text-sm text-primary outline-none transition focus:border-accent"
            />
          </div>
        )}
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle/30 text-muted">
            <Users className="h-6 w-6" aria-hidden />
          </span>
          <p className="max-w-[220px] text-sm leading-relaxed text-muted">
            {isSearching ? t("searchEmpty") : t("empty")}
          </p>
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
