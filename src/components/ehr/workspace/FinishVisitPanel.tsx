"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Loader2,
  Printer,
  Save,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import { saveConsultationNotes } from "@/actions/saveConsultationNotes";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { PrescriptionRecord } from "@/lib/clinical/prescriptionTypes";

interface FinishVisitPanelProps {
  patientId: string;
  patientName: string;
  currentVisit: PatientVisitRecord | null;
  consultationNotes: string;
  notesDirty: boolean;
  latestPrescription: PrescriptionRecord | null;
  clinicName: string;
  doctorName: string;
  onVisitCompleted: () => void;
  onNotesSaved: () => void;
  onPrintPrescription: (rx: PrescriptionRecord) => void;
  onOpenFollowUp: () => void;
  onOpenPayment: () => void;
}

export function FinishVisitPanel({
  patientId,
  patientName,
  currentVisit,
  consultationNotes,
  notesDirty,
  latestPrescription,
  clinicName,
  doctorName,
  onVisitCompleted,
  onNotesSaved,
  onPrintPrescription,
  onOpenFollowUp,
  onOpenPayment,
}: FinishVisitPanelProps) {
  const tw = useTranslations("ehr.workspace");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actions, setActions] = useState({
    saveNotes: true,
    printRx: false,
    scheduleFollowUp: false,
    recordPayment: false,
  });
  const [isFinishing, startFinishing] = useTransition();

  // Only show Finish Visit when there's an active visit that isn't completed
  const canFinish =
    currentVisit &&
    currentVisit.status !== "completed" &&
    currentVisit.status !== "canceled" &&
    currentVisit.status !== "no_show";

  if (!canFinish) {
    return null;
  }

  // TypeScript can't narrow across early return — extract non-null reference
  const visit = currentVisit!;

  function toggleAction(key: keyof typeof actions) {
    setActions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleFinish() {
    startFinishing(async () => {
      try {
        // 1. Save notes if requested and dirty
        if (actions.saveNotes && notesDirty) {
          const notesResult = await saveConsultationNotes({
            patientId,
            notes: consultationNotes,
            appointmentId: visit.id,
          });
          if (!notesResult.success) {
            toast.error(tw("notesSaveError"), { description: notesResult.error });
            return;
          }
          onNotesSaved();
        }

        // 2. Mark visit as completed
        const statusResult = await updateAppointmentStatus(
          visit.id,
          "completed",
        );
        if (!statusResult.success) {
          toast.error(statusResult.error ?? "Could not complete visit");
          return;
        }

        // 3. Print prescription if requested
        if (actions.printRx && latestPrescription) {
          onPrintPrescription(latestPrescription);
        }

        // 4. Schedule follow-up if requested (open modal)
        if (actions.scheduleFollowUp) {
          onOpenFollowUp();
        }

        // 5. Record payment if requested (open modal)
        if (actions.recordPayment) {
          onOpenPayment();
        }

        toast.success(tw("finishVisitSuccess"));
        onVisitCompleted();
        setSheetOpen(false);
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  }

  const checkboxItems: {
    key: keyof typeof actions;
    label: string;
    icon: typeof Save;
    checked: boolean;
    disabled?: boolean;
  }[] = [
    {
      key: "saveNotes",
      label: tw("finishSaveVisit"),
      icon: Save,
      checked: actions.saveNotes,
    },
    {
      key: "printRx",
      label: tw("finishPrintRx"),
      icon: Printer,
      checked: actions.printRx,
      disabled: !latestPrescription,
    },
    {
      key: "scheduleFollowUp",
      label: tw("finishScheduleFollowUp"),
      icon: CalendarPlus,
      checked: actions.scheduleFollowUp,
    },
    {
      key: "recordPayment",
      label: tw("finishOpenPayment"),
      icon: Wallet,
      checked: actions.recordPayment,
    },
  ];

  return (
    <section id="workspace-finish" className="mb-10 text-start hide-on-print">
      {/* Primary action button */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="w-full rounded-2xl bg-accent py-4 text-base font-semibold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-[0.99]"
      >
        <CheckCircle2 className="me-2 inline-block h-5 w-5" aria-hidden />
        {tw("finishVisit")}
      </button>

      {/* Confirmation sheet */}
      <AnimatePresence>
        {sheetOpen ? (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40"
              onClick={() => !isFinishing && setSheetOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[201] mx-auto max-w-lg rounded-t-3xl border-t border-subtle bg-surface p-6 shadow-2xl"
            >
              {/* Handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-subtle" />

              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-primary">
                  {tw("finishVisitTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => !isFinishing && setSheetOpen(false)}
                  className="rounded-lg p-1 text-muted transition hover:text-primary"
                  disabled={isFinishing}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-5 text-xs text-muted">{tw("finishVisitHint")}</p>

              {/* Checklist */}
              <div className="space-y-3">
                {checkboxItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.disabled || isFinishing}
                      onClick={() => toggleAction(item.key)}
                      className={[
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm transition",
                        item.checked && !item.disabled
                          ? "border-accent/30 bg-accent/5 text-primary"
                          : "border-subtle bg-elevated/30 text-muted",
                        item.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-accent/20",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                          item.checked && !item.disabled
                            ? "border-accent bg-accent text-white"
                            : "border-subtle",
                        ].join(" ")}
                      >
                        {item.checked && !item.disabled ? (
                          <Check className="h-3 w-3" />
                        ) : null}
                      </div>
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Confirm / Cancel */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => !isFinishing && setSheetOpen(false)}
                  disabled={isFinishing}
                  className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:text-primary"
                >
                  {tw("finishVisitCancel")}
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isFinishing}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {isFinishing ? (
                    <Loader2 className="me-1.5 inline-block h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="me-1.5 inline-block h-4 w-4" />
                  )}
                  {tw("finishVisitConfirm")}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
