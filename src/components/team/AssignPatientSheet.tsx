"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignPatientToStaff } from "@/actions/manageTeam";
import type { Appointment } from "@/lib/dashboard/types";
import { listAssignableAppointments } from "@/lib/team/buildTeamOpsDerived";

interface AssignPatientSheetProps {
  open: boolean;
  staffId: string;
  staffName: string;
  appointments: Appointment[];
  onClose: () => void;
  onAssigned: (appointment: Appointment) => void;
}

export function AssignPatientSheet({
  open,
  staffId,
  staffName,
  appointments,
  onClose,
  onAssigned,
}: AssignPatientSheetProps) {
  const t = useTranslations("teamOps.assign");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const candidates = useMemo(
    () =>
      listAssignableAppointments(appointments).filter(
        (a) => a.assignedStaffId !== staffId,
      ),
    [appointments, staffId],
  );

  function assign(appointment: Appointment) {
    setPendingId(appointment.id);
    startTransition(async () => {
      const result = await assignPatientToStaff(appointment.id, staffId);
      setPendingId(null);
      if (!result.success) {
        toast.error(result.error ?? t("error"));
        return;
      }
      onAssigned({
        ...appointment,
        assignedStaffId: staffId,
        assignedStaffName: staffName,
      });
      toast.success(t("success", { name: appointment.patientName }));
      onClose();
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-patient-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-subtle bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-subtle px-5 py-4">
              <div className="text-start">
                <h2 id="assign-patient-title" className="text-lg font-semibold text-primary">
                  {t("title")}
                </h2>
                <p className="mt-1 text-sm text-muted">{t("subtitle", { name: staffName })}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              {candidates.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">{t("empty")}</p>
              ) : (
                <ul className="space-y-2">
                  {candidates.map((appt) => (
                    <li key={appt.id}>
                      <button
                        type="button"
                        disabled={pendingId === appt.id}
                        onClick={() => assign(appt)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-subtle bg-elevated/40 px-3 py-3 text-start transition hover:border-accent/30 hover:bg-elevated disabled:opacity-60"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-primary">
                            {appt.patientName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {appt.serviceName}
                            {appt.assignedStaffName
                              ? ` · ${t("currentlyWith", { name: appt.assignedStaffName })}`
                              : ` · ${t("unassigned")}`}
                          </p>
                        </div>
                        {pendingId === appt.id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
                        ) : (
                          <span className="shrink-0 text-xs font-semibold text-accent">
                            {t("assign")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
