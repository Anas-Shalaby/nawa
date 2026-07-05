"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { CalendarDays, MessageCircle, StickyNote, UserRound } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import {
  formatAgendaSectionLabel,
  formatAgendaTime,
  groupAgendaByDate,
} from "@/lib/agenda/groupByDate";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";

interface AgendaShellProps {
  appointments: AgendaAppointment[];
}

function formatAppointmentDateForWhatsApp(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function AgendaShell({ appointments }: AgendaShellProps) {
  const t = useTranslations("agenda");
  const locale = useLocale() as Locale;

  const groups = useMemo(() => groupAgendaByDate(appointments), [appointments]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="text-start">
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle", { count: appointments.length })}</p>
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
              className="rounded-2xl border border-subtle bg-surface/50 overflow-hidden"
            >
              <header className="border-b border-subtle bg-base/40 px-5 py-3 text-start">
                <h2 className="text-sm font-semibold text-primary">
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
                  />
                ))}
              </ul>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaRow({
  appointment,
  locale,
  index,
}: {
  appointment: AgendaAppointment;
  locale: Locale;
  index: number;
}) {
  const t = useTranslations("agenda");
  const whatsappUrl = buildWhatsAppActionUrl(
    appointment.phoneNumber,
    "appointment",
    {
      patientName: appointment.patientName,
      appointmentDate: formatAppointmentDateForWhatsApp(appointment.appointmentDate, locale),
      locale,
    },
  );

  const price =
    appointment.isReExamination
      ? 0
      : appointment.servicePriceEgp;

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 text-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
          <UserRound className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/patients/${appointment.patientId}`}
              className="font-semibold text-primary transition hover:text-accent"
            >
              {appointment.patientName}
            </Link>
            <span className="text-xs tabular-nums text-muted" dir="ltr">
              {appointment.phoneNumber}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-primary">{appointment.serviceName}</span>
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

          <p className="mt-1 text-xs text-muted">
            {formatAgendaTime(appointment.appointmentDate, locale)}
          </p>

          {appointment.doctorNotes && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-subtle bg-base/40 px-3 py-2">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              <p className="text-sm leading-relaxed text-primary">{appointment.doctorNotes}</p>
            </div>
          )}
        </div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
          "bg-[#25D366] text-sm font-medium text-white transition hover:bg-[#20BD5A]",
          "w-full sm:w-auto",
        ].join(" ")}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {t("whatsappReminder")}
      </a>
    </motion.li>
  );
}
