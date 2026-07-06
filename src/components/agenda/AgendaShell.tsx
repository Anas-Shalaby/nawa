"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  Loader2,
  MessageCircle,
  Pencil,
  StickyNote,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { cancelAgendaAppointment } from "@/actions/manageAgendaAppointment";
import type { Locale } from "@/i18n/routing";
import {
  formatAgendaSectionLabel,
  formatAgendaTime,
  groupAgendaByDate,
} from "@/lib/agenda/groupByDate";
import { formatAppointmentDateLong, formatAppointmentTime } from "@/lib/datetime/cairo";
import type { DashboardService } from "@/lib/dashboard/types";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import {
  AgendaAppointmentModal,
  type AgendaPatientOption,
} from "./AgendaAppointmentModal";

interface AgendaShellProps {
  appointments: AgendaAppointment[];
  services: DashboardService[];
  patients: AgendaPatientOption[];
}

function formatAppointmentDateForWhatsApp(isoDate: string, locale: Locale): string {
  return `${formatAppointmentDateLong(isoDate, locale)} · ${formatAppointmentTime(isoDate, locale)}`;
}

export function AgendaShell({
  appointments: initialAppointments,
  services,
  patients,
}: AgendaShellProps) {
  const t = useTranslations("agenda");
  const locale = useLocale() as Locale;
  const [appointments, setAppointments] = useState(initialAppointments);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AgendaAppointment | null>(
    null,
  );

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const groups = useMemo(() => groupAgendaByDate(appointments), [appointments]);

  function openCreate() {
    setModalMode("create");
    setEditingAppointment(null);
    setModalOpen(true);
  }

  function openEdit(appointment: AgendaAppointment) {
    setModalMode("edit");
    setEditingAppointment(appointment);
    setModalOpen(true);
  }

  function handleSaved(appointment: AgendaAppointment) {
    if (modalMode === "create") {
      setAppointments((current) =>
        [...current, appointment].sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
      );
      toast.success(t("createSuccess"));
      return;
    }

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
    setAppointments((current) => current.filter((item) => item.id !== appointmentId));
    toast.success(t("cancelSuccess"));
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-start">
          <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("subtitle", { count: appointments.length })}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={services.length === 0 || patients.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          {t("addAppointment")}
        </button>
      </header>

      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-subtle bg-surface/50 px-6 py-14 text-center"
        >
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden />
          <p className="text-sm text-muted">{t("empty")}</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.dateKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.04 }}
              className="overflow-hidden rounded-2xl border border-subtle bg-surface/50"
            >
              <header className="border-b border-subtle bg-base/40 px-6 py-4 text-start">
                <h2 className="text-base font-semibold text-primary">
                  {formatAgendaSectionLabel(group.dateKey, locale, {
                    today: t("today"),
                    tomorrow: t("tomorrow"),
                  })}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  {t("dayCount", { count: group.appointments.length })}
                </p>
              </header>

              <ul className="divide-y divide-subtle">
                {group.appointments.map((appointment, index) => (
                  <AgendaRow
                    key={appointment.id}
                    appointment={appointment}
                    locale={locale}
                    index={index}
                    onEdit={openEdit}
                    onCancelled={handleCancelled}
                  />
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
      )}

      <AgendaAppointmentModal
        open={modalOpen}
        mode={modalMode}
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

function AgendaRow({
  appointment,
  locale,
  index,
  onEdit,
  onCancelled,
}: {
  appointment: AgendaAppointment;
  locale: Locale;
  index: number;
  onEdit: (appointment: AgendaAppointment) => void;
  onCancelled: (appointmentId: string) => void;
}) {
  const t = useTranslations("agenda");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isPending, startTransition] = useTransition();

  const whatsappUrl = buildWhatsAppActionUrl(
    appointment.phoneNumber,
    "appointment",
    {
      patientName: appointment.patientName,
      appointmentDate: formatAppointmentDateForWhatsApp(
        appointment.appointmentDate,
        locale,
      ),
      locale,
    },
  );

  const price = appointment.isReExamination ? 0 : appointment.servicePriceEgp;

  function handleCancel() {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }

    startTransition(async () => {
      const result = await cancelAgendaAppointment(appointment.id);

      if (!result.success) {
        toast.error(t("error"), { description: result.error });
        setConfirmCancel(false);
        return;
      }

      onCancelled(appointment.id);
    });
  }

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 text-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <UserRound className="h-6 w-6 text-accent" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/patients/${appointment.patientId}`}
              className="font-semibold text-primary transition hover:text-accent"
            >
              {appointment.patientName}
            </Link>
            <span className="text-sm tabular-nums text-muted" dir="ltr">
              {appointment.phoneNumber}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-base text-primary">{appointment.serviceName}</span>
            {appointment.isReExamination && (
              <span className="rounded-full bg-[#A29BFE]/15 px-2 py-0.5 text-xs font-medium text-[#A29BFE]">
                {t("reExamBadge")}
              </span>
            )}
            {price !== null && (
              <span className="text-xs text-muted">
                {t("price", {
                  amount: new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                    maximumFractionDigits: 0,
                  }).format(price),
                })}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm text-muted">
            {formatAgendaTime(appointment.appointmentDate, locale)}
          </p>

          {appointment.doctorNotes && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-subtle bg-base/40 px-3 py-2">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              <p className="text-sm leading-relaxed text-primary">
                {appointment.doctorNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#20BD5A]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t("whatsappReminder")}
        </a>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(appointment)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-subtle px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-elevated"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t("editAction")}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleCancel}
            onBlur={() => setConfirmCancel(false)}
            className={[
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50",
              confirmCancel
                ? "bg-accent-danger text-white hover:bg-accent-danger/90"
                : "border border-subtle text-accent-danger hover:bg-accent-danger/10",
            ].join(" ")}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            {confirmCancel ? t("confirmCancel") : t("cancelAction")}
          </button>
        </div>
      </div>
    </motion.li>
  );
}
