"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addWalkIn } from "@/actions/addWalkIn";
import {
  createPatientBookingSchema,
  type PatientBookingFormValues,
} from "@/lib/booking/schema";
import type { Appointment, DashboardService } from "@/lib/dashboard/types";

interface WalkInModalProps {
  services: DashboardService[];
  onSuccess: (appointment: Appointment) => void;
}

export function WalkInModal({ services, onSuccess }: WalkInModalProps) {
  const t = useTranslations("dashboard.walkIn");
  const tv = useTranslations("validation");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultServiceId = services[0]?.id ?? "";
  const overlayRef = useRef<HTMLDivElement>(null);

  const schema = useMemo(() => createPatientBookingSchema((key) => tv(key)), [tv]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", whatsapp: "" },
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setError(null);
        reset();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, reset]);

  function closeModal() {
    setOpen(false);
    setError(null);
    reset();
  }

  function onSubmit(values: PatientBookingFormValues) {
    if (!defaultServiceId) return;

    setError(null);

    startTransition(async () => {
      const result = await addWalkIn({
        name: values.name,
        whatsapp: values.whatsapp,
        serviceId: defaultServiceId,
      });

      if (!result.success) {
        setError(result.error ?? t("error"));
        return;
      }

      closeModal();
      if (result.appointment) {
        onSuccess(result.appointment);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={services.length === 0}
        className={[
          "inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10",
          "px-4 py-2.5 text-sm font-medium text-accent transition",
          "hover:bg-accent/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        ].join(" ")}
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {t("addWalkIn")}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === overlayRef.current) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={[
                "w-full max-w-md rounded-2xl border border-subtle bg-elevated",
                "p-0 text-primary shadow-2xl",
              ].join(" ")}
              role="dialog"
              aria-modal="true"
              aria-labelledby="walkin-title"
            >
              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="walkin-title" className="text-lg font-semibold">
                      {t("title")}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary"
                    aria-label={t("close")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="walkin-name" className="mb-1.5 block text-sm text-muted">
                    {t("nameLabel")}
                  </label>
                  <input
                    id="walkin-name"
                    {...register("name")}
                    autoComplete="name"
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                    placeholder={t("namePlaceholder")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-accent-danger">
                      {tv(errors.name.message as "nameMin")}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="walkin-phone" className="mb-1.5 block text-sm text-muted">
                    {t("phoneLabel")}
                  </label>
                  <input
                    id="walkin-phone"
                    {...register("whatsapp")}
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                    placeholder="01XXXXXXXXX"
                  />
                  {errors.whatsapp && (
                    <p className="mt-1 text-xs text-accent-danger">
                      {tv(errors.whatsapp.message as "whatsappInvalid")}
                    </p>
                  )}
                </div>

                {services.length > 1 && (
                  <p className="text-xs text-muted">
                    {t("serviceNote", { service: services[0]?.name ?? "" })}
                  </p>
                )}

                {error && (
                  <p className="rounded-lg border border-accent-danger/20 bg-accent-danger/5 px-3 py-2 text-sm text-accent-danger">
                    {error}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {isPending ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
