"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { assignPatientToStaff } from "@/actions/manageTeam";
import type { Appointment } from "@/lib/dashboard/types";
import { listWaitingForStaff } from "@/lib/team/buildTeamOpsDerived";
import type { TeamMemberView } from "@/lib/team/types";

interface TransferPatientSheetProps {
  open: boolean;
  fromMember: TeamMemberView;
  members: TeamMemberView[];
  appointments: Appointment[];
  onClose: () => void;
  onTransferred: (appointment: Appointment, toStaffId: string, toStaffName: string) => void;
}

export function TransferPatientSheet({
  open,
  fromMember,
  members,
  appointments,
  onClose,
  onTransferred,
}: TransferPatientSheetProps) {
  const t = useTranslations("teamOps.transfer");
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const waiting = useMemo(
    () => listWaitingForStaff(appointments, fromMember.id),
    [appointments, fromMember.id],
  );

  const destinations = useMemo(
    () =>
      members.filter(
        (m) =>
          m.id !== fromMember.id &&
          m.id !== "primary-doctor" &&
          (m.role === "doctor" || m.role === "nurse") &&
          m.status !== "offline" &&
          m.status !== "on_leave",
      ),
    [members, fromMember.id],
  );

  function transfer(toStaffId: string, toStaffName: string) {
    const apptId = selectedApptId ?? waiting[0]?.id;
    if (!apptId) return;
    const appt = waiting.find((a) => a.id === apptId);
    if (!appt) return;

    startTransition(async () => {
      const result = await assignPatientToStaff(appt.id, toStaffId);
      if (!result.success) {
        toast.error(result.error ?? t("error"));
        return;
      }
      onTransferred(appt, toStaffId, toStaffName);
      toast.success(t("success", { patient: appt.patientName, doctor: toStaffName }));
      setSelectedApptId(null);
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
            aria-labelledby="transfer-patient-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-subtle bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-subtle px-5 py-4">
              <div className="text-start">
                <h2 id="transfer-patient-title" className="text-lg font-semibold text-primary">
                  {t("title")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {t("subtitle", { name: fromMember.displayName })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("pickPatient")}
                </p>
                {waiting.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-subtle px-3 py-6 text-center text-sm text-muted">
                    {t("emptyWaiting")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {waiting.map((appt) => {
                      const active = (selectedApptId ?? waiting[0]?.id) === appt.id;
                      return (
                        <li key={appt.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedApptId(appt.id)}
                            className={[
                              "w-full rounded-xl border px-3 py-2.5 text-start text-sm transition",
                              active
                                ? "border-accent/40 bg-accent/10 text-primary"
                                : "border-subtle bg-elevated/40 text-primary hover:border-accent/20",
                            ].join(" ")}
                          >
                            {appt.patientName}
                            <span className="mt-0.5 block text-xs text-muted">{appt.serviceName}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("pickDestination")}
                </p>
                {destinations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-subtle px-3 py-6 text-center text-sm text-muted">
                    {t("emptyDestinations")}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {destinations.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          disabled={pending || waiting.length === 0}
                          onClick={() => transfer(member.id, member.displayName)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-subtle bg-elevated/40 px-3 py-2.5 text-start transition hover:border-accent/30 hover:bg-elevated disabled:opacity-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">{member.displayName}</p>
                            <p className="text-xs text-muted">
                              {t("destMeta", {
                                waiting: member.waitingPatients,
                                heat: member.workload.pct,
                              })}
                            </p>
                          </div>
                          {pending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-accent" />
                          ) : (
                            <span className="text-xs font-semibold text-accent">{t("transfer")}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
