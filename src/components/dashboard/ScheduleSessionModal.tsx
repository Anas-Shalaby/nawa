"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Loader2, X } from "lucide-react";
import { scheduleFollowUp } from "@/actions/scheduleFollowUp";
import type { Locale } from "@/i18n/routing";
import { generateWorkingDaySlots } from "@/lib/datetime/cairo";
import {
  addCairoDays,
  buildFollowUpAppointmentIso,
  formatCairoDateKey,
} from "@/lib/datetime/followUp";
import type { DashboardService } from "@/lib/dashboard/types";

type SessionType = "new" | "reExam";
type QuickInterval = "tomorrow" | "1w" | "2w";

export interface ScheduleSessionModalProps {
  open: boolean;
  patientId: string;
  patientName: string;
  defaultServiceId?: string;
  services: DashboardService[];
  tenantId: string;
  onClose: () => void;
  onScheduled?: () => void;
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

export function ScheduleSessionModal({
  open,
  patientId,
  patientName,
  defaultServiceId,
  services,
  tenantId,
  onClose,
  onScheduled,
}: ScheduleSessionModalProps) {
  const t = useTranslations("dashboard.schedule");
  const locale = useLocale() as Locale;
  const slots = useMemo(() => generateWorkingDaySlots(), []);

  const [sessionType, setSessionType] = useState<SessionType>("new");
  const [selectedDate, setSelectedDate] = useState("");
  const [slotTime, setSlotTime] = useState("10:00");
  const [activeQuick, setActiveQuick] = useState<QuickInterval | null>(
    "tomorrow",
  );
  const [serviceId, setServiceId] = useState(
    defaultServiceId ?? services[0]?.id ?? "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedService = services.find((service) => service.id === serviceId);
  const displayPrice =
    sessionType === "reExam" ? 0 : (selectedService?.priceEgp ?? null);

  useEffect(() => {
    if (!open) return;

    setSessionType("new");
    setSelectedDate(addCairoDays(1));
    setActiveQuick("tomorrow");
    setSlotTime("10:00");
    setServiceId(defaultServiceId ?? services[0]?.id ?? "");
    setNotes("");
    setError(null);
  }, [open, patientId, defaultServiceId, services]);

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

    const futureDateIso = buildFollowUpAppointmentIso(selectedDate, slotTime);
    const isReExamination = sessionType === "reExam";

    onClose();
    onScheduled?.();

    startTransition(async () => {
      const result = await scheduleFollowUp(
        patientId,
        tenantId,
        serviceId,
        futureDateIso,
        notes || null,
        isReExamination,
      );

      if (!result.success) {
        console.error("[ScheduleSessionModal]", result.error);
      }
    });
  }

  const minDate = formatCairoDateKey();

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
            disabled={isPending}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-session-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={[
              "fixed inset-x-4 top-[6%] z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl",
              "border border-subtle bg-surface shadow-2xl ",
            ].join(" ")}
          >
            <div className="border-b border-subtle px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 text-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <CalendarPlus className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <div>
                    <h2
                      id="schedule-session-title"
                      className="text-lg font-semibold text-primary"
                    >
                      {t("title")}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      {t("patientLabel", { name: patientName })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                  aria-label={t("close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 text-start">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {t("sessionType")}
                </p>
                <div className="flex gap-1 rounded-lg border border-subtle bg-base/60 p-1">
                  <TypeToggle
                    active={sessionType === "new"}
                    label={t("typeNew")}
                    onClick={() => setSessionType("new")}
                  />
                  <TypeToggle
                    active={sessionType === "reExam"}
                    label={t("typeReExam")}
                    onClick={() => setSessionType("reExam")}
                  />
                </div>
                {displayPrice !== null && (
                  <p className="mt-2 text-sm text-muted">
                    {t("priceHint", {
                      amount: new Intl.NumberFormat(
                        locale === "ar" ? "ar-EG" : "en-EG",
                        {
                          maximumFractionDigits: 0,
                        },
                      ).format(displayPrice),
                    })}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {t("selectDate")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["tomorrow", t("quickTomorrow")],
                      ["1w", t("quick1Week")],
                      ["2w", t("quick2Weeks")],
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
                    htmlFor="schedule-date"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {t("customDate")}
                  </label>
                  <input
                    id="schedule-date"
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(event) => handleCustomDate(event.target.value)}
                    className="w-full rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="schedule-time"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                  >
                    {t("timeLabel")}
                  </label>
                  <select
                    id="schedule-time"
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
                  htmlFor="schedule-service"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {t("serviceLabel")}
                </label>
                <select
                  id="schedule-service"
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
                  htmlFor="schedule-notes"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {t("notesLabel")}
                </label>
                <textarea
                  id="schedule-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                  className={[
                    "w-full resize-none rounded-xl border border-subtle bg-base/40 px-4 py-2.5 text-sm text-primary",
                    "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                  ].join(" ")}
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
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !selectedDate || !serviceId}
                className={[
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                  "bg-accent text-sm font-medium text-white transition hover:bg-accent/90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ].join(" ")}
              >
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                {t("submit")}
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
