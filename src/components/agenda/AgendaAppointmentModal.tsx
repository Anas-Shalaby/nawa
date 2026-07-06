"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Loader2, X } from "lucide-react";
import {
  createAgendaAppointment,
  updateAgendaAppointment,
} from "@/actions/manageAgendaAppointment";
import type { Locale } from "@/i18n/routing";
import { generateWorkingDaySlots } from "@/lib/datetime/cairo";
import {
  addCairoDays,
  buildFollowUpAppointmentIso,
  extractSlotTimeFromIso,
  formatCairoDateKey,
} from "@/lib/datetime/followUp";
import { getCairoDateKeyFromIso } from "@/lib/datetime/cairo";
import type { DashboardService } from "@/lib/dashboard/types";
import type { AgendaAppointment } from "@/lib/queries/agenda";

type SessionType = "new" | "reExam";
type QuickInterval = "tomorrow" | "1w" | "2w";

export interface AgendaPatientOption {
  id: string;
  name: string;
  phoneNumber: string;
}

interface AgendaAppointmentModalProps {
  open: boolean;
  mode: "create" | "edit";
  appointment: AgendaAppointment | null;
  patients: AgendaPatientOption[];
  services: DashboardService[];
  onClose: () => void;
  onSaved: (appointment: AgendaAppointment) => void;
}

function formatDisplayDate(
  dateKey: string,
  slotTime: string,
  locale: Locale,
): string {
  const iso = buildFollowUpAppointmentIso(dateKey, slotTime);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

export function AgendaAppointmentModal({
  open,
  mode,
  appointment,
  patients,
  services,
  onClose,
  onSaved,
}: AgendaAppointmentModalProps) {
  const t = useTranslations("agenda");
  const tSchedule = useTranslations("dashboard.schedule");
  const locale = useLocale() as Locale;
  const slots = useMemo(() => generateWorkingDaySlots(), []);

  const [patientId, setPatientId] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("new");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotTime, setSlotTime] = useState("10:00");
  const [activeQuick, setActiveQuick] = useState<QuickInterval | null>("tomorrow");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPatient =
    patients.find((patient) => patient.id === patientId) ??
    (appointment
      ? {
          id: appointment.patientId,
          name: appointment.patientName,
          phoneNumber: appointment.phoneNumber,
        }
      : null);

  const selectedService = services.find((service) => service.id === serviceId);
  const displayPrice =
    sessionType === "reExam" ? 0 : (selectedService?.priceEgp ?? null);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && appointment) {
      setPatientId(appointment.patientId);
      setSessionType(appointment.isReExamination ? "reExam" : "new");
      setSelectedDate(getCairoDateKeyFromIso(appointment.appointmentDate));
      setSlotTime(extractSlotTimeFromIso(appointment.appointmentDate));
      setActiveQuick(null);
      setServiceId(appointment.serviceId);
      setNotes(appointment.doctorNotes ?? "");
      setError(null);
      return;
    }

    setPatientId(patients[0]?.id ?? "");
    setSessionType("new");
    setSelectedDate(addCairoDays(1));
    setActiveQuick("tomorrow");
    setSlotTime("10:00");
    setServiceId(services[0]?.id ?? "");
    setNotes("");
    setError(null);
  }, [open, mode, appointment, patients, services]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, isPending, onClose]);

  function applyQuickInterval(interval: QuickInterval) {
    setActiveQuick(interval);
    if (interval === "tomorrow") setSelectedDate(addCairoDays(1));
    if (interval === "1w") setSelectedDate(addCairoDays(7));
    if (interval === "2w") setSelectedDate(addCairoDays(14));
  }

  function handleCustomDate(value: string) {
    setActiveQuick(null);
    setSelectedDate(value);
  }

  function handleSubmit() {
    if (!selectedDate || !serviceId) return;
    if (mode === "create" && !patientId) {
      setError(t("patientRequired"));
      return;
    }

    const futureDateIso = buildFollowUpAppointmentIso(selectedDate, slotTime);
    const isReExamination = sessionType === "reExam";
    const payload = {
      serviceId,
      appointmentDateIso: futureDateIso,
      notes: notes || null,
      isReExamination,
    };

    setError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAgendaAppointment({ patientId, ...payload })
          : await updateAgendaAppointment(appointment!.id, payload);

      if (!result.success) {
        setError(result.error ?? t("error"));
        return;
      }

      const savedAppointment: AgendaAppointment = {
        id: result.appointmentId ?? appointment?.id ?? "",
        patientId: selectedPatient?.id ?? patientId,
        patientName: selectedPatient?.name ?? appointment?.patientName ?? "",
        phoneNumber: selectedPatient?.phoneNumber ?? appointment?.phoneNumber ?? "",
        serviceId,
        serviceName: selectedService?.name ?? appointment?.serviceName ?? "",
        servicePriceEgp: selectedService?.priceEgp ?? appointment?.servicePriceEgp ?? null,
        appointmentDate: futureDateIso,
        doctorNotes: payload.notes,
        isReExamination,
        status: appointment?.status ?? "confirmed",
      };

      onSaved(savedAppointment);
      onClose();
    });
  }

  const minDate = formatCairoDateKey();
  const title = mode === "create" ? t("createTitle") : t("editTitle");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={tSchedule("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            disabled={isPending}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-appointment-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed inset-x-4 top-[6%] z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-subtle bg-surface shadow-2xl"
          >
            <div className="border-b border-subtle px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 text-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <CalendarPlus className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <div>
                    <h2
                      id="agenda-appointment-title"
                      className="text-lg font-semibold text-primary"
                    >
                      {title}
                    </h2>
                    {selectedPatient && (
                      <p className="mt-0.5 text-sm text-muted">
                        {tSchedule("patientLabel", { name: selectedPatient.name })}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                  aria-label={tSchedule("close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 text-start">
              {mode === "create" && (
                <div>
                  <label
                    htmlFor="agenda-patient"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {t("patientLabel")}
                  </label>
                  <select
                    id="agenda-patient"
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">{t("selectPatient")}</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} — {patient.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {tSchedule("sessionType")}
                </p>
                <div className="flex gap-1 rounded-lg border border-subtle bg-base/60 p-1">
                  <TypeToggle
                    active={sessionType === "new"}
                    label={tSchedule("typeNew")}
                    onClick={() => setSessionType("new")}
                  />
                  <TypeToggle
                    active={sessionType === "reExam"}
                    label={tSchedule("typeReExam")}
                    onClick={() => setSessionType("reExam")}
                  />
                </div>
                {displayPrice !== null && (
                  <p className="mt-2 text-sm text-muted">
                    {tSchedule("priceHint", {
                      amount: new Intl.NumberFormat(
                        locale === "ar" ? "ar-EG" : "en-EG",
                        { maximumFractionDigits: 0 },
                      ).format(displayPrice),
                    })}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {tSchedule("selectDate")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["tomorrow", tSchedule("quickTomorrow")],
                      ["1w", tSchedule("quick1Week")],
                      ["2w", tSchedule("quick2Weeks")],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyQuickInterval(key)}
                      className={[
                        "rounded-lg border px-3 py-2 text-sm font-medium transition",
                        activeQuick === key
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-subtle text-muted hover:border-accent/30 hover:text-primary",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {selectedDate && (
                  <p className="mt-2 text-sm text-primary">
                    {formatDisplayDate(selectedDate, slotTime, locale)}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="agenda-date"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {tSchedule("customDate")}
                  </label>
                  <input
                    id="agenda-date"
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(event) => handleCustomDate(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="agenda-time"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {tSchedule("timeLabel")}
                  </label>
                  <select
                    id="agenda-time"
                    value={slotTime}
                    onChange={(event) => setSlotTime(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="agenda-service"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {tSchedule("serviceLabel")}
                </label>
                <select
                  id="agenda-service"
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  disabled={services.length === 0}
                  className="w-full rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="agenda-notes"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {tSchedule("notesLabel")}
                </label>
                <textarea
                  id="agenda-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder={tSchedule("notesPlaceholder")}
                  className="w-full resize-none rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {error && <p className="text-sm text-accent-danger">{error}</p>}
            </div>

            <div className="flex gap-2 border-t border-subtle px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-subtle px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-elevated disabled:opacity-50"
              >
                {tSchedule("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !selectedDate ||
                  !serviceId ||
                  (mode === "create" && !patientId)
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {isPending ? t("saving") : mode === "create" ? t("createAction") : t("saveAction")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TypeToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-md px-3 py-2 text-sm font-medium transition",
        active ? "bg-accent/15 text-accent" : "text-muted hover:text-primary",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
