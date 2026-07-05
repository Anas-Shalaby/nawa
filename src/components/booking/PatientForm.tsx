"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, User } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { slideInX } from "@/lib/i18n/motion";
import {
  createPatientBookingSchema,
  type PatientBookingFormValues,
} from "@/lib/booking/schema";
import { SoftBanCard } from "./SoftBanCard";

interface PatientFormProps {
  selectedTimeLabel: string;
  clinicName: string;
  clinicWhatsApp: string;
  isSoftBanned: boolean;
  isSubmitting: boolean;
  slotError: string | null;
  onBack: () => void;
  onSubmit: (values: PatientBookingFormValues) => void;
}

export function PatientForm({
  selectedTimeLabel,
  clinicName,
  clinicWhatsApp,
  isSoftBanned,
  isSubmitting,
  slotError,
  onBack,
  onSubmit,
}: PatientFormProps) {
  const t = useTranslations("booking");
  const tv = useTranslations("validation");
  const locale = useLocale() as Locale;

  const schema = useMemo(
    () =>
      createPatientBookingSchema((key) =>
        tv(key as "nameMin" | "nameMax" | "whatsappRequired" | "whatsappInvalid"),
      ),
    [tv],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", whatsapp: "" },
  });

  return (
    <motion.section
      initial={{ opacity: 0, x: slideInX(locale) }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="px-5 text-start"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-booking-muted transition hover:text-booking-text"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t("changeTime")}
      </button>

      <div className="mb-6 rounded-2xl border border-booking-accent/20 bg-booking-accent-light px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-booking-accent">
          {t("selected")}
        </p>
        <p className="text-lg font-semibold text-booking-text">{selectedTimeLabel}</p>
      </div>

      {isSoftBanned ? (
        <SoftBanCard clinicName={clinicName} whatsappNumber={clinicWhatsApp} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-booking-text"
            >
              {t("fullName")}
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-booking-muted"
                aria-hidden
              />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder={t("namePlaceholder")}
                className={[
                  "w-full rounded-xl border bg-booking-surface py-3.5 ps-11 pe-4 text-base text-booking-text",
                  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-booking-accent/40",
                  errors.name ? "border-red-300" : "border-gray-200",
                ].join(" ")}
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="whatsapp"
              className="mb-2 block text-sm font-medium text-booking-text"
            >
              {t("whatsappNumber")}
            </label>
            <input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("whatsappPlaceholder")}
              className={[
                "w-full rounded-xl border bg-booking-surface px-4 py-3.5 text-base text-booking-text",
                "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-booking-accent/40",
                errors.whatsapp ? "border-red-300" : "border-gray-200",
              ].join(" ")}
              {...register("whatsapp")}
            />
            {errors.whatsapp && (
              <p className="mt-1.5 text-sm text-red-500">{errors.whatsapp.message}</p>
            )}
            <p className="mt-1.5 text-xs text-booking-muted">{t("whatsappHint")}</p>
          </div>

          {slotError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{slotError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={[
              "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl",
              "bg-booking-accent text-base font-semibold text-white shadow-lg shadow-booking-accent/20",
              "transition hover:brightness-105 active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {t("bookingProgress")}
              </>
            ) : (
              t("confirmBooking")
            )}
          </button>
        </form>
      )}
    </motion.section>
  );
}
