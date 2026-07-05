"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  CalendarCheck2,
  Clock,
  MapPin,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cancelAppointment } from "@/actions/cancelAppointment";

interface BookingSuccessProps {
  appointmentId: string;
  tenantSlug: string;
  clinicName: string;
  timeLabel: string;
  patientName: string;
  mapsQuery?: string;
}

function buildMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function BookingSuccess({
  appointmentId,
  tenantSlug,
  clinicName,
  timeLabel,
  patientName,
  mapsQuery,
}: BookingSuccessProps) {
  const t = useTranslations("booking");
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const directionsUrl = buildMapsUrl(mapsQuery ?? `${clinicName} Cairo Egypt`);

  function handleCancel() {
    setCancelError(null);

    startTransition(async () => {
      const result = await cancelAppointment(appointmentId, tenantSlug);

      if (!result.success) {
        setCancelError(result.error ?? t("cancelError"));
        return;
      }

      setCancelled(true);
    });
  }

  if (cancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[100dvh] flex-col items-center justify-center px-5 py-12 text-center"
      >
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <XCircle className="h-10 w-10 text-gray-400" strokeWidth={1.5} aria-hidden />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-booking-text">{t("cancelledTitle")}</h2>
        <p className="max-w-xs text-sm leading-relaxed text-booking-muted">
          {t("cancelledBody", { time: timeLabel })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="flex min-h-[100dvh] flex-col px-5 py-10"
    >
      <div className="mx-auto w-full max-w-sm">
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 26 }}
          className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-b from-white to-teal-50/40 shadow-xl shadow-teal-900/5"
        >
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-booking-accent to-teal-300"
            aria-hidden
          />

          <div className="border-b border-dashed border-teal-100 px-6 pb-5 pt-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 22 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20"
            >
              <Sparkles className="h-8 w-8 text-teal-600" strokeWidth={1.5} aria-hidden />
            </motion.div>

            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              {t("ticketLabel")}
            </p>
            <h2 className="text-2xl font-semibold text-booking-text">{t("successTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-booking-muted">
              {t("successBody", { name: patientName, clinic: clinicName, time: timeLabel })}
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-gray-100">
              <CalendarCheck2 className="h-5 w-5 shrink-0 text-booking-accent" aria-hidden />
              <div className="text-start">
                <p className="text-xs text-booking-muted">{t("ticketClinic")}</p>
                <p className="text-sm font-medium text-booking-text">{clinicName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-gray-100">
              <Clock className="h-5 w-5 shrink-0 text-booking-accent" aria-hidden />
              <div className="text-start">
                <p className="text-xs text-booking-muted">{t("ticketTime")}</p>
                <p className="text-sm font-medium text-booking-text">{timeLabel}</p>
              </div>
            </div>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "flex w-full items-center justify-center gap-2 rounded-xl",
                "bg-booking-accent px-4 py-3.5 text-sm font-semibold text-white",
                "shadow-lg shadow-booking-accent/20 transition active:scale-[0.98] hover:brightness-105",
              ].join(" ")}
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {t("getDirections")}
            </a>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 text-start">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                {t("preVisitTitle")}
              </p>
              <ul className="space-y-2 text-sm text-amber-900/80">
                <li>{t("preVisit1")}</li>
                <li>{t("preVisit2")}</li>
                <li>{t("preVisit3")}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dashed border-teal-100 px-6 py-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className={[
                "w-full rounded-xl border border-gray-200 bg-white/70 px-4 py-3",
                "text-sm font-medium text-booking-muted transition",
                "hover:border-red-200 hover:text-red-500 disabled:opacity-50",
              ].join(" ")}
            >
              {isPending ? t("cancelling") : t("cancelAppointment")}
            </button>
            {cancelError && (
              <p className="mt-2 text-center text-xs text-red-500">{cancelError}</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
