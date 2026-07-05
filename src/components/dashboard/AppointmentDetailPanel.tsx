"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  Loader2,
  Tag,
  UserRoundSearch,
  UserX,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { getQueueStatusColor } from "@/lib/dashboard/queueStateMachine";
import type { QueueAppointment, DashboardService } from "@/lib/dashboard/types";
import { ScheduleSessionButton } from "@/components/dashboard/ScheduleSessionButton";
import { WhatsAppActionMenu } from "@/components/whatsapp/WhatsAppActionMenu";
import { PatientDetailTabs, type PatientDetailTab } from "@/components/ehr/PatientDetailTabs";
import { PatientVisualEhr } from "@/components/ehr/PatientVisualEhr";

interface AppointmentDetailPanelProps {
  appointment: QueueAppointment | null;
  tenantId: string;
  services: DashboardService[];
  isNoShowPending: boolean;
  onNoShow: (appointment: QueueAppointment) => void;
}

function formatTime(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function AppointmentDetailPanel({
  appointment,
  tenantId,
  services,
  isNoShowPending,
  onNoShow,
}: AppointmentDetailPanelProps) {
  const t = useTranslations("dashboard.detail");
  const tDash = useTranslations("dashboard");
  const tEhr = useTranslations("ehr");
  const locale = useLocale() as Locale;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("general");

  useEffect(() => {
    setActiveTab("general");
  }, [appointment?.id]);

  if (!appointment) {
    return (
      <section className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-subtle bg-surface/30 p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative mb-6"
        >
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-subtle bg-gradient-to-br from-accent/20 via-surface to-base shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            style={{ transform: "perspective(600px) rotateX(8deg) rotateY(-12deg)" }}
          >
            <UserRoundSearch className="h-10 w-10 text-accent" strokeWidth={1.5} />
          </div>
          <span
            className="absolute -bottom-2 -end-2 h-8 w-8 rounded-xl border border-subtle bg-accent/15"
            aria-hidden
          />
        </motion.div>
        <p className="max-w-xs text-sm leading-relaxed text-muted">{t("empty")}</p>
      </section>
    );
  }

  const statusColor = getQueueStatusColor(appointment.status);
  const canMarkNoShow = appointment.status !== "completed";
  const appointmentDateLabel = formatTime(appointment.appointmentDate, locale);

  const strikeLabel =
    appointment.noShowCount === 1
      ? tDash("strikes", { count: appointment.noShowCount })
      : tDash("strikesPlural", { count: appointment.noShowCount });

  return (
    <motion.section
      key={appointment.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className="flex h-full min-h-[420px] flex-col rounded-2xl border border-subtle bg-surface/50"
    >
      <header className="border-b border-subtle px-5 py-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${statusColor}18`,
              color: statusColor,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
              aria-hidden
            />
            {t(`status.${appointment.status}`)}
          </span>
          {appointment.noShowCount > 0 && (
            <span className="rounded-full bg-accent-danger/10 px-2.5 py-1 text-xs font-medium text-accent-danger">
              {strikeLabel}
            </span>
          )}
        </div>

        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="text-start">
            <h2 className="text-xl font-semibold text-primary">{appointment.patientName}</h2>
            <p className="mt-1 text-sm text-muted">{formatTime(appointment.appointmentDate, locale)}</p>
          </div>
          <Link
            href={`/dashboard/patients/${appointment.patientId}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-subtle px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/30 hover:text-accent"
            title={tEhr("openPatientRecord")}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{tEhr("openPatientRecord")}</span>
          </Link>
        </div>

        <PatientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto p-5">
        {activeTab === "general" ? (
          <>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {t("contact")}
              </p>
              <p className="mb-3 text-base text-primary" dir="ltr">
                {appointment.phoneNumber}
              </p>
              <ScheduleSessionButton
                patientId={appointment.patientId}
                patientName={appointment.patientName}
                defaultServiceId={appointment.serviceId}
                services={services}
                tenantId={tenantId}
              />
              <div className="mt-3">
                <WhatsAppActionMenu
                  phoneNumber={appointment.phoneNumber}
                  patientName={appointment.patientName}
                  appointmentDate={appointmentDateLabel}
                  templates={["appointment", "financial", "recall"]}
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-subtle bg-base/40 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                {t("service")}
              </p>
              <p className="mb-3 font-medium text-primary">{appointment.serviceName}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  {t("duration", { minutes: appointment.durationMinutes })}
                </span>
                {appointment.priceEgp !== null && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-accent">
                    <Tag className="h-4 w-4 shrink-0" aria-hidden />
                    {t("price", { amount: appointment.priceEgp.toLocaleString() })}
                  </span>
                )}
              </div>
            </div>

            {canMarkNoShow && (
              <div className="mt-auto border-t border-subtle pt-4">
                <p className="mb-3 text-xs text-muted">{t("disciplineHint")}</p>
                <button
                  type="button"
                  disabled={isNoShowPending}
                  onClick={() => onNoShow(appointment)}
                  className={[
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3",
                    "border-accent-danger/25 bg-accent-danger/10 text-sm font-medium text-accent-danger",
                    "transition hover:bg-accent-danger/20 disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                >
                  {isNoShowPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <UserX className="h-4 w-4" aria-hidden />
                  )}
                  {isNoShowPending ? tDash("markingNoShow") : tDash("noShow")}
                </button>
              </div>
            )}
          </>
        ) : (
          <PatientVisualEhr
            key={appointment.patientId}
            patientId={appointment.patientId}
            patientName={appointment.patientName}
            tenantId={tenantId}
            compact
          />
        )}
      </div>
    </motion.section>
  );
}
