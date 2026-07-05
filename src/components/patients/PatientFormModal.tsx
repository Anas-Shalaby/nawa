"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { createPatient, updatePatient } from "@/actions/managePatients";
import type { PatientRecord } from "@/lib/queries/patients";

export interface PatientFormValues {
  name: string;
  whatsapp: string;
  notes: string;
}

interface PatientFormModalProps {
  open: boolean;
  title: string;
  patient: PatientRecord | null;
  onClose: () => void;
  onSaved: (values: PatientFormValues, patientId?: string) => void;
}

export function PatientFormModal({
  open,
  title,
  patient,
  onClose,
  onSaved,
}: PatientFormModalProps) {
  const t = useTranslations("patients.form");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    defaultValues: {
      name: "",
      whatsapp: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: patient?.name ?? "",
        whatsapp: patient?.phoneNumber ?? "",
        notes: patient?.notes ?? "",
      });
    }
  }, [open, patient, reset]);

  async function onSubmit(values: PatientFormValues) {
    const payload = {
      name: values.name,
      whatsapp: values.whatsapp,
      notes: values.notes || null,
    };

    const result = patient
      ? await updatePatient(patient.id, payload)
      : await createPatient(payload);

    if (!result.success) {
      return;
    }

    onSaved(values, result.patientId ?? patient?.id);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="fixed inset-x-4 top-[12%] z-50 mx-auto max-w-md rounded-2xl border border-subtle bg-surface p-6 shadow-2xl "
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 text-start"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  {t("name")}
                </label>
                <input
                  {...register("name", { required: true, minLength: 2 })}
                  placeholder={t("namePlaceholder")}
                  className="w-full rounded-xl border border-subtle bg-base px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-accent-danger">
                    {t("nameError")}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  {t("whatsapp")}
                </label>
                <input
                  {...register("whatsapp", { required: true })}
                  placeholder={t("whatsappPlaceholder")}
                  dir="ltr"
                  className="w-full rounded-xl border border-subtle bg-base px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                />
                {errors.whatsapp && (
                  <p className="mt-1 text-xs text-accent-danger">
                    {t("whatsappError")}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  {t("notes")}
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-none rounded-xl border border-subtle bg-base px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-elevated"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
