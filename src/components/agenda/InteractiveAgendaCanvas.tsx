"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { cancelAgendaAppointment } from "@/actions/manageAgendaAppointment";
import { findNextAvailableSlot } from "@/actions/internalBooking";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import { useGlobalBookingDrawer } from "@/components/booking/GlobalBookingDrawerContext";
import { QueueStatusSelect } from "@/components/dashboard/QueueStatusSelect";
import {
  buildCairoAppointmentIso,
  formatSlotLabel,
  getCairoDateKeyFromIso,
  getCairoTodayKey,
} from "@/lib/datetime/cairo";
import { AGENDA_SELECTABLE_STATUSES } from "@/lib/dashboard/queueStateMachine";
import type { AppointmentStatus, DashboardService } from "@/lib/dashboard/types";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import type { WorkingHoursDay } from "@/lib/scheduling/types";
import type { Locale } from "@/i18n/routing";
import {
  AgendaAppointmentModal,
  type AgendaPatientOption,
} from "./AgendaAppointmentModal";

type CalendarView = "day" | "week";

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 36;

interface InteractiveAgendaCanvasProps {
  appointments: AgendaAppointment[];
  services: DashboardService[];
  patients: AgendaPatientOption[];
  workingHours: WorkingHoursDay[];
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending:
    "border-status-pending bg-status-pending/15 text-status-pending",
  confirmed:
    "border-status-confirmed bg-status-confirmed/15 text-status-confirmed",
  checked_in:
    "border-status-checkedIn bg-status-checkedIn/15 text-status-checkedIn",
  in_session:
    "border-status-in_session bg-status-in_session/15 text-status-in_session",
  completed:
    "border-status-completed bg-status-completed/15 text-status-completed",
  no_show: "border-accent-danger bg-accent-danger/15 text-accent-danger",
  canceled: "border-muted bg-muted/10 text-muted",
};

export function InteractiveAgendaCanvas({
  appointments: initialAppointments,
  services,
  patients,
  workingHours,
}: InteractiveAgendaCanvasProps) {
  const t = useTranslations("agenda");
  const tc = useTranslations("agenda.calendar");
  const locale = useLocale() as Locale;
  const { openBookingDrawer } = useGlobalBookingDrawer();
  const [view, setView] = useState<CalendarView>("week");
  const [anchorDate, setAnchorDate] = useState(getCairoTodayKey());
  const [appointments, setAppointments] = useState(initialAppointments);
  const [editingAppointment, setEditingAppointment] =
    useState<AgendaAppointment | null>(null);
  const [isFindingSlot, startFindSlot] = useTransition();

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const visibleDates = useMemo(
    () =>
      view === "day"
        ? [anchorDate]
        : getWeekDates(getWeekStart(anchorDate)),
    [anchorDate, view],
  );

  const { startHour, endHour } = useMemo(
    () => deriveTimelineBounds(workingHours),
    [workingHours],
  );

  const visibleAppointments = useMemo(() => {
    const dates = new Set(visibleDates);
    return appointments.filter((appointment) =>
      dates.has(getCairoDateKeyFromIso(appointment.appointmentDate)),
    );
  }, [appointments, visibleDates]);

  function navigate(direction: -1 | 1) {
    setAnchorDate((current) =>
      addDaysToDateKey(current, direction * (view === "week" ? 7 : 1)),
    );
  }

  function handleSaved(saved: AgendaAppointment) {
    setAppointments((current) =>
      current
        .map((appointment) =>
          appointment.id === saved.id ? saved : appointment,
        )
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
    );
    setEditingAppointment(null);
    toast.success(t("updateSuccess"));
  }

  function handleFindNextAvailable() {
    if (isFindingSlot) return;

    startFindSlot(async () => {
      try {
        const slot = await findNextAvailableSlot(services[0]?.id);

        if (!slot) {
          toast.error(tc("nextAvailableEmpty"));
          return;
        }

        setAnchorDate(slot.date);
        openBookingDrawer({
          date: slot.date,
          time: slot.time,
          serviceId: slot.serviceId,
        });

        const dateLabel = new Intl.DateTimeFormat(
          locale === "ar" ? "ar-EG" : "en-EG",
          {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Africa/Cairo",
          },
        ).format(new Date(buildCairoAppointmentIso(slot.date, "12:00")));

        toast.success(tc("nextAvailableFound", {
          date: dateLabel,
          time: formatSlotLabel(slot.time, locale, slot.date),
        }));
      } catch (error) {
        toast.error(tc("nextAvailableError"), {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });
  }

  return (
    <div className="w-full bg-base" dir="rtl">
      <header className="mb-4 text-start">
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {tc("appointmentsCount", { count: visibleAppointments.length })}
        </p>
      </header>

      <div className="sticky top-16 z-20 mb-4 rounded-2xl border border-subtle bg-base/90 p-3 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-subtle bg-surface p-1">
              {(["day", "week"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={[
                    "relative rounded-lg px-4 py-2 text-sm font-semibold transition",
                    view === option
                      ? "text-accent"
                      : "text-muted hover:text-primary",
                  ].join(" ")}
                >
                  {view === option ? (
                    <motion.span
                      layoutId="agenda-view-toggle"
                      className="absolute inset-0 rounded-lg bg-accent/15"
                    />
                  ) : null}
                  <span className="relative">
                    {option === "day" ? tc("dayView") : tc("weekView")}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-xl border border-subtle bg-surface">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label={tc("previous")}
                className="rounded-s-xl p-2.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate(getCairoTodayKey())}
                className="border-x border-subtle px-3 py-2 text-sm font-semibold text-primary transition hover:bg-elevated"
              >
                {tc("today")}
              </button>
              <button
                type="button"
                onClick={() => navigate(1)}
                aria-label={tc("next")}
                className="rounded-e-xl p-2.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <label className="relative">
              <CalendarDays className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="date"
                value={anchorDate}
                aria-label={tc("datePicker")}
                onChange={(event) => setAnchorDate(event.target.value)}
                className="rounded-xl border border-subtle bg-surface py-2 pe-3 ps-9 text-sm font-medium text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleFindNextAvailable}
            disabled={isFindingSlot || services.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-bold text-accent shadow-[0_0_24px_-8px] shadow-accent transition hover:bg-accent/15 hover:shadow-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFindingSlot ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {isFindingSlot ? tc("nextAvailableSearching") : tc("nextAvailable")}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${visibleDates[0]}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm"
        >
          <div className="max-h-[calc(100vh-15rem)] overflow-auto">
            <div
              className="min-w-max"
              style={{
                width:
                  view === "week"
                    ? `max(100%, ${72 + visibleDates.length * 150}px)`
                    : "100%",
              }}
            >
              <div
                className="sticky top-0 z-20 grid border-b border-subtle bg-surface/95 backdrop-blur-md"
                style={{
                  gridTemplateColumns: `72px repeat(${visibleDates.length}, minmax(150px, 1fr))`,
                }}
              >
                <div className="flex items-center justify-center border-e border-subtle p-3 text-muted">
                  <Clock3 className="h-4 w-4" aria-hidden />
                </div>
                {visibleDates.map((date) => (
                  <DayHeader key={date} date={date} locale={locale} />
                ))}
              </div>

              <div
                className="grid"
                style={{
                  gridTemplateColumns: `72px repeat(${visibleDates.length}, minmax(150px, 1fr))`,
                }}
              >
                <TimeAxis startHour={startHour} endHour={endHour} />
                {visibleDates.map((date) => (
                  <DayColumn
                    key={date}
                    date={date}
                    appointments={visibleAppointments.filter(
                      (appointment) =>
                        getCairoDateKeyFromIso(appointment.appointmentDate) ===
                        date,
                    )}
                    workingHours={workingHours}
                    startHour={startHour}
                    endHour={endHour}
                    locale={locale}
                    newBookingLabel={tc("newBooking")}
                    onEmptySlot={(time) =>
                      openBookingDrawer({ date, time })
                    }
                    onReschedule={setEditingAppointment}
                    onCancelled={(appointmentId) =>
                      setAppointments((current) =>
                        current.filter(
                          (appointment) => appointment.id !== appointmentId,
                        ),
                      )
                    }
                    onStatusChange={(appointmentId, status) =>
                      setAppointments((current) =>
                        current.map((appointment) =>
                          appointment.id === appointmentId
                            ? { ...appointment, status }
                            : appointment,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AgendaAppointmentModal
        open={Boolean(editingAppointment)}
        mode="edit"
        appointment={editingAppointment}
        patients={patients}
        services={services}
        onClose={() => setEditingAppointment(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}

function DayHeader({ date, locale }: { date: string; locale: Locale }) {
  const isToday = date === getCairoTodayKey();
  const value = new Date(buildCairoAppointmentIso(date, "12:00"));
  const weekday = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    timeZone: "Africa/Cairo",
  }).format(value);
  const day = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Cairo",
  }).format(value);

  return (
    <div className="border-e border-subtle p-3 text-center last:border-e-0">
      <p className="text-xs font-medium text-muted">{weekday}</p>
      <p
        className={[
          "mx-auto mt-1 w-fit rounded-full px-2 py-0.5 text-sm font-bold",
          isToday ? "bg-accent text-white" : "text-primary",
        ].join(" ")}
      >
        {day}
      </p>
    </div>
  );
}

function TimeAxis({
  startHour,
  endHour,
}: {
  startHour: number;
  endHour: number;
}) {
  const height = (endHour - startHour) * 60 * (SLOT_HEIGHT / SLOT_MINUTES);

  return (
    <div
      className="relative border-e border-subtle bg-base/30"
      style={{ height }}
    >
      {Array.from({ length: endHour - startHour + 1 }, (_, index) => {
        const hour = startHour + index;
        return (
          <span
            key={hour}
            dir="ltr"
            className="absolute inset-x-0 -translate-y-1/2 text-center text-[11px] tabular-nums text-muted"
            style={{ top: index * SLOT_HEIGHT * 2 }}
          >
            {hour.toString().padStart(2, "0")}:00
          </span>
        );
      })}
    </div>
  );
}

function DayColumn({
  date,
  appointments,
  workingHours,
  startHour,
  endHour,
  locale,
  newBookingLabel,
  onEmptySlot,
  onReschedule,
  onCancelled,
  onStatusChange,
}: {
  date: string;
  appointments: AgendaAppointment[];
  workingHours: WorkingHoursDay[];
  startHour: number;
  endHour: number;
  locale: Locale;
  newBookingLabel: string;
  onEmptySlot: (time: string) => void;
  onReschedule: (appointment: AgendaAppointment) => void;
  onCancelled: (appointmentId: string) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
}) {
  const dayOfWeek = dateKeyDayOfWeek(date);
  const dayHours = workingHours.find((day) => day.dayOfWeek === dayOfWeek);
  const slotsCount = ((endHour - startHour) * 60) / SLOT_MINUTES;
  const now = Date.now();

  return (
    <div
      className="relative border-e border-subtle last:border-e-0"
      style={{ height: slotsCount * SLOT_HEIGHT }}
    >
      {Array.from({ length: slotsCount }, (_, index) => {
        const minutes = startHour * 60 + index * SLOT_MINUTES;
        const time = minutesToTime(minutes);
        const working = isWorkingSlot(dayHours, minutes);
        const future =
          new Date(buildCairoAppointmentIso(date, time)).getTime() > now;

        return (
          <button
            key={time}
            type="button"
            disabled={!working || !future}
            onClick={() => onEmptySlot(time)}
            className={[
              "group absolute inset-x-0 flex items-center justify-center border-b border-subtle text-[10px] transition",
              working && future
                ? "text-transparent hover:bg-accent/5 hover:text-accent"
                : "cursor-not-allowed bg-base/35 text-transparent",
            ].join(" ")}
            style={{ top: index * SLOT_HEIGHT, height: SLOT_HEIGHT }}
          >
            <span className="opacity-0 transition-opacity group-hover:opacity-100">
              {newBookingLabel}
            </span>
          </button>
        );
      })}

      {appointments.map((appointment) => (
        <AppointmentBlock
          key={appointment.id}
          appointment={appointment}
          startHour={startHour}
          locale={locale}
          onReschedule={onReschedule}
          onCancelled={onCancelled}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}

function AppointmentBlock({
  appointment,
  startHour,
  locale,
  onReschedule,
  onCancelled,
  onStatusChange,
}: {
  appointment: AgendaAppointment;
  startHour: number;
  locale: Locale;
  onReschedule: (appointment: AgendaAppointment) => void;
  onCancelled: (appointmentId: string) => void;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => void;
}) {
  const t = useTranslations("agenda");
  const tc = useTranslations("agenda.calendar");
  const tStatus = useTranslations("dashboard.detail.status");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const time = getCairoTime(appointment.appointmentDate);
  const minutes = timeToMinutes(time);
  const top = (minutes - startHour * 60) * (SLOT_HEIGHT / SLOT_MINUTES);
  const height = Math.max(
    appointment.durationMinutes * (SLOT_HEIGHT / SLOT_MINUTES),
    SLOT_HEIGHT,
  );

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  function cancelAppointment() {
    if (!window.confirm(t("cancelConfirm"))) return;
    startTransition(async () => {
      const result = await cancelAgendaAppointment(appointment.id);
      if (!result.success) {
        toast.error(t("error"), { description: result.error });
        return;
      }
      setOpen(false);
      onCancelled(appointment.id);
      toast.success(t("cancelSuccess"));
    });
  }

  function handleStatusChange(status: AppointmentStatus) {
    if (status === appointment.status) return;

    const previous = appointment.status;
    setIsUpdatingStatus(true);
    onStatusChange(appointment.id, status);

    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, status);

      if (!result.success) {
        onStatusChange(appointment.id, previous);
        toast.error(t("error"), { description: result.error });
        setIsUpdatingStatus(false);
        return;
      }

      toast.success(t("statusUpdateSuccess"));
      setIsUpdatingStatus(false);
    });
  }

  return (
    <div
      ref={rootRef}
      className="absolute inset-x-1 z-10"
      style={{ top: top + 2, height: Math.max(height - 4, 32) }}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "relative h-full w-full overflow-hidden rounded-md border-s-4 p-2 text-start text-xs shadow-sm transition hover:brightness-110",
          STATUS_STYLES[appointment.status],
        ].join(" ")}
      >
        {appointment.serviceColorCode ? (
          <span
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: appointment.serviceColorCode }}
            aria-hidden
          />
        ) : null}
        <span className="block truncate font-bold">
          {appointment.patientName}
        </span>
        <span className="mt-0.5 block truncate opacity-80">
          {appointment.serviceName}
        </span>
        {height >= 58 ? (
          <span className="mt-1 flex items-center justify-between gap-1 text-[10px] opacity-70">
            <span className="tabular-nums" dir="ltr">
              {formatTimeLabel(time, locale)}
            </span>
            <span className="truncate font-medium">
              {tStatus(appointment.status)}
            </span>
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="absolute start-0 top-full z-50 mt-2 w-60 rounded-xl border border-subtle bg-surface p-3 text-start shadow-2xl shadow-black/30"
          >
            <p className="text-sm font-bold text-primary">
              {appointment.patientName}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted" dir="ltr">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {appointment.phoneNumber}
            </p>

            <div className="mt-3 space-y-2 border-t border-subtle pt-3">
              <p className="text-[11px] font-medium text-muted">
                {t("statusLabel")}
              </p>
              <QueueStatusSelect
                value={appointment.status}
                allowedStatuses={AGENDA_SELECTABLE_STATUSES}
                isUpdating={isUpdatingStatus}
                compact
                onChange={handleStatusChange}
              />
              {appointment.status === "pending" ? (
                <p className="text-[10px] leading-relaxed text-muted">
                  {t("pendingSlotHint")}
                </p>
              ) : null}
            </div>

            <div className="mt-3 grid gap-1 border-t border-subtle pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onReschedule(appointment);
                }}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-primary transition hover:bg-elevated"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {tc("reschedule")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={cancelAppointment}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-accent-danger transition hover:bg-accent-danger/10 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                )}
                {tc("cancel")}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function deriveTimelineBounds(workingHours: WorkingHoursDay[]) {
  const shifts = workingHours.flatMap((day) => (day.isOpen ? day.shifts : []));
  if (shifts.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  const earliest = Math.floor(
    Math.min(...shifts.map((shift) => timeToMinutes(shift.startTime))) / 60,
  );
  const latest = Math.ceil(
    Math.max(...shifts.map((shift) => timeToMinutes(shift.endTime))) / 60,
  );

  return {
    startHour: Math.min(DEFAULT_START_HOUR, earliest),
    endHour: Math.max(DEFAULT_END_HOUR, latest),
  };
}

function isWorkingSlot(
  day: WorkingHoursDay | undefined,
  startMinutes: number,
): boolean {
  if (!day?.isOpen) return false;
  const endMinutes = startMinutes + SLOT_MINUTES;
  return day.shifts.some(
    (shift) =>
      startMinutes >= timeToMinutes(shift.startTime) &&
      endMinutes <= timeToMinutes(shift.endTime),
  );
}

function getWeekStart(dateKey: string): string {
  return addDaysToDateKey(dateKey, -dateKeyDayOfWeek(dateKey));
}

function getWeekDates(startDateKey: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateKey(startDateKey, index),
  );
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function dateKeyDayOfWeek(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;
}

function getCairoTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatTimeLabel(time: string, locale: Locale): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(2020, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}
