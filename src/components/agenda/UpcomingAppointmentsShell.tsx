"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarX2,
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelAgendaAppointment,
  updateAgendaAppointmentStatus,
  type AgendaEditableStatus,
} from "@/actions/manageAgendaAppointment";
import type { Locale } from "@/i18n/routing";
import {
  formatAgendaSectionLabel,
  formatAgendaTime,
  groupAgendaByDate,
} from "@/lib/agenda/groupByDate";
import { getCairoDateKeyFromIso } from "@/lib/datetime/cairo";
import { addCairoDays, addCairoMonths, formatCairoDateKey } from "@/lib/datetime/followUp";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import {
  AgendaAppointmentModal,
  type AgendaPatientOption,
} from "./AgendaAppointmentModal";
import type { DashboardService } from "@/lib/dashboard/types";

type QuickFilter = "all" | "week" | "month";

interface UpcomingAppointmentsShellProps {
  appointments: AgendaAppointment[];
  services: DashboardService[];
  patients: AgendaPatientOption[];
}

const STATUS_STYLES: Record<AgendaEditableStatus, string> = {
  pending: "bg-status-pending/15 text-status-pending ring-1 ring-inset ring-status-pending/20",
  confirmed: "bg-status-confirmed/15 text-status-confirmed ring-1 ring-inset ring-status-confirmed/20",
};

const AGENDA_STATUSES: AgendaEditableStatus[] = ["pending", "confirmed"];

function statusStyle(status: AppointmentStatus): string {
  if (status === "pending" || status === "confirmed") {
    return STATUS_STYLES[status];
  }
  return "bg-subtle/30 text-muted ring-1 ring-inset ring-subtle";
}

export function UpcomingAppointmentsShell({
  appointments: initialAppointments,
  services,
  patients,
}: UpcomingAppointmentsShellProps) {
  const t = useTranslations("agenda");
  const locale = useLocale() as Locale;

  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<QuickFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AgendaAppointment | null>(null);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const filtered = useMemo(() => {
    const todayKey = formatCairoDateKey();
    const weekEnd = addCairoDays(6);
    const monthEnd = addCairoMonths(1);

    return appointments.filter((appointment) => {
      const key = getCairoDateKeyFromIso(appointment.appointmentDate);

      if (filter === "week") return key >= todayKey && key <= weekEnd;
      if (filter === "month") return key >= todayKey && key <= monthEnd;
      return true;
    });
  }, [appointments, filter]);

  const groups = useMemo(() => groupAgendaByDate(filtered), [filtered]);

  function openReschedule(appointment: AgendaAppointment) {
    setEditingAppointment(appointment);
    setModalOpen(true);
  }

  function handleSaved(appointment: AgendaAppointment) {
    setAppointments((current) =>
      current
        .map((item) => (item.id === appointment.id ? appointment : item))
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
    );
    toast.success(t("updateSuccess"));
  }

  function handleCancelled(appointmentId: string) {
    setAppointments((current) =>
      current.filter((item) => item.id !== appointmentId),
    );
  }

  function handleStatusChanged(appointmentId: string, status: AgendaEditableStatus) {
    setAppointments((current) =>
      current.map((item) => (item.id === appointmentId ? { ...item, status } : item)),
    );
  }

  const chips: { id: QuickFilter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "week", label: t("filterWeek") },
    { id: "month", label: t("filterMonth") },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="mb-5 text-start">
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle", { count: appointments.length })}
        </p>
      </header>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto overflow-y-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={[
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
              filter === chip.id
                ? "bg-accent/15 text-accent"
                : "border border-subtle bg-surface text-muted hover:border-accent/30 hover:text-primary",
            ].join(" ")}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState message={t("rangeEmpty")} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.dateKey}>
              <div className="sticky top-0 z-10 -mx-1 mb-3 rounded-lg border border-subtle bg-base/80 px-4 py-2 backdrop-blur-md">
                <h2 className="text-sm font-medium text-muted">
                  {formatAgendaSectionLabel(group.dateKey, locale, {
                    today: t("today"),
                    tomorrow: t("tomorrow"),
                  })}
                </h2>
              </div>

              <motion.ul layout className="space-y-3">
                <AnimatePresence initial={false}>
                  {group.appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      locale={locale}
                      onReschedule={openReschedule}
                      onCancelled={handleCancelled}
                      onStatusChanged={handleStatusChanged}
                    />
                  ))}
                </AnimatePresence>
              </motion.ul>
            </section>
          ))}
        </div>
      )}

      <AgendaAppointmentModal
        open={modalOpen}
        mode="edit"
        appointment={editingAppointment}
        patients={patients}
        services={services}
        onClose={() => {
          setModalOpen(false);
          setEditingAppointment(null);
        }}
        onSaved={handleSaved}
      />
    </div>
  );
}

function AppointmentCard({
  appointment,
  locale,
  onReschedule,
  onCancelled,
  onStatusChanged,
}: {
  appointment: AgendaAppointment;
  locale: Locale;
  onReschedule: (appointment: AgendaAppointment) => void;
  onCancelled: (appointmentId: string) => void;
  onStatusChanged: (appointmentId: string, status: AgendaEditableStatus) => void;
}) {
  const t = useTranslations("agenda");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleStatusChange(nextStatus: AgendaEditableStatus) {
    if (nextStatus === appointment.status || statusUpdating || isPending) return;

    const previousStatus = appointment.status as AgendaEditableStatus;
    onStatusChanged(appointment.id, nextStatus);
    setStatusUpdating(true);

    startTransition(async () => {
      const result = await updateAgendaAppointmentStatus(appointment.id, nextStatus);

      if (!result.success) {
        onStatusChanged(appointment.id, previousStatus);
        toast.error(t("error"), { description: result.error });
        setStatusUpdating(false);
        return;
      }

      toast.success(t("statusChangeSuccess"));
      setStatusUpdating(false);
    });
  }

  function handleCancel() {
    setMenuOpen(false);
    if (!window.confirm(t("cancelConfirm"))) return;

    startTransition(async () => {
      const result = await cancelAgendaAppointment(appointment.id);

      if (!result.success) {
        toast.error(t("error"), { description: result.error });
        return;
      }

      onCancelled(appointment.id);
      toast.success(t("cancelSuccess"));
    });
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={[
        "grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-subtle bg-surface p-4 transition-all hover:border-accent/30",
        isPending || statusUpdating ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="border-e border-subtle pe-4 text-center">
        <p className="text-lg font-bold tabular-nums text-primary" dir="ltr">
          {formatAgendaTime(appointment.appointmentDate, locale)}
        </p>
      </div>

      <div className="min-w-0 text-start">
        <p className="truncate font-bold text-primary">{appointment.patientName}</p>
        <p className="mt-0.5 truncate text-sm tabular-nums text-muted" dir="ltr">
          {appointment.phoneNumber}
        </p>
        <span className="mt-2 inline-flex max-w-full items-center truncate rounded-md bg-base/70 px-2.5 py-1 text-xs font-medium text-primary">
          {appointment.serviceName}
        </span>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div
          className="relative shrink-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {statusUpdating ? (
            <span className="inline-flex h-8 min-w-[6.5rem] items-center justify-center rounded-full border border-subtle bg-base/80 text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            </span>
          ) : (
            <>
              <select
                value={appointment.status}
                disabled={isPending}
                aria-label={t("statusLabel")}
                onChange={(event) =>
                  handleStatusChange(event.target.value as AgendaEditableStatus)
                }
                className={[
                  "h-8 min-w-[6.5rem] cursor-pointer appearance-none rounded-full pe-7 ps-3 text-xs font-medium outline-none transition",
                  "focus:ring-2 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50",
                  statusStyle(appointment.status),
                ].join(" ")}
              >
                {AGENDA_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === "pending" ? t("statusPending") : t("statusConfirmed")}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                aria-hidden
              />
            </>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            disabled={isPending}
            aria-haspopup="menu"
            aria-label={t("actionsMenu")}
            title={t("actionsMenu")}
            className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="menu"
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-subtle bg-surface shadow-2xl shadow-black/40 ltr:right-0 rtl:left-0"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onReschedule(appointment);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-sm text-primary transition hover:bg-elevated"
                >
                  <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                  {t("rescheduleAction")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCancel}
                  className="flex w-full items-center gap-2.5 border-t border-subtle px-3 py-2.5 text-start text-sm text-accent-danger transition hover:bg-accent-danger/10"
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  {t("cancelBooking")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-subtle bg-surface/30 px-6 py-20 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-base/70">
        <CalendarX2 className="h-7 w-7 text-muted" aria-hidden />
      </div>
      <p className="text-sm text-muted">{message}</p>
    </motion.div>
  );
}
