"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarPlus,
  CalendarRange,
  MessageCircle,
  Phone,
  Wallet,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { PatientMediaRecord } from "@/lib/media/types";
import type { PatientRecord } from "@/lib/queries/patients";
import type { DashboardService } from "@/lib/dashboard/types";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import { formatAppointmentDateLong, formatAppointmentTime } from "@/lib/datetime/cairo";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { PatientVisualEhr } from "./PatientVisualEhr";

interface PatientDetailShellProps {
  patient: PatientRecord;
  tenantId: string;
  initialMedia: PatientMediaRecord[];
  initialVisits?: PatientVisitRecord[];
  initialPayments: PatientPaymentRecord[];
  services: DashboardService[];
  backHref?: string;
  compact?: boolean;
}

type PatientDetailTab = "medical" | "appointments" | "financials";

type FinancialRow = {
  id: string;
  serviceName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  total: number;
  paid: number;
  remaining: number;
};

const STATUS_STYLES: Record<AppointmentStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-status-pending/15", text: "text-status-pending" },
  confirmed: { bg: "bg-status-confirmed/15", text: "text-status-confirmed" },
  checked_in: { bg: "bg-status-checkedIn/15", text: "text-status-checkedIn" },
  in_session: { bg: "bg-accent/15", text: "text-accent" },
  completed: { bg: "bg-status-completed/15", text: "text-status-completed" },
  no_show: { bg: "bg-accent-danger/15", text: "text-accent-danger" },
  canceled: { bg: "bg-muted/15", text: "text-muted" },
};

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildFinancialRows(
  visits: PatientVisitRecord[],
  payments: PatientPaymentRecord[],
): FinancialRow[] {
  const invoiceBase = visits
    .filter((visit) => visit.priceEgp !== null)
    .filter((visit) => visit.status !== "canceled" && visit.status !== "no_show")
    .map((visit) => ({
      id: visit.id,
      serviceName: visit.serviceName,
      appointmentDate: visit.appointmentDate,
      status: visit.status,
      total: Math.max(visit.priceEgp ?? 0, 0),
    }))
    .sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    );

  let paymentPool = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  return invoiceBase
    .map((row) => {
      const paid = Math.min(row.total, paymentPool);
      paymentPool -= paid;

      return {
        ...row,
        paid,
        remaining: Math.max(row.total - paid, 0),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
    );
}

export function PatientDetailShell({
  patient,
  tenantId,
  initialMedia,
  initialVisits,
  initialPayments,
  services,
  backHref = "/dashboard/patients",
  compact = false,
}: PatientDetailShellProps) {
  const t = useTranslations("ehr");
  const tStatus = useTranslations("dashboard.detail.status");
  const locale = useLocale() as Locale;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("medical");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const visits = initialVisits ?? [];

  const totalVisits = visits.length;
  const lastVisit = visits[0]?.appointmentDate ?? null;
  const initials = getInitials(patient.name);
  const whatsappUrl = buildWhatsAppActionUrl(patient.phoneNumber, "appointment", {
    patientName: patient.name,
    locale,
  });

  const financialRows = useMemo(
    () => buildFinancialRows(visits, initialPayments),
    [visits, initialPayments],
  );
  const totalCost = financialRows.reduce((sum, row) => sum + row.total, 0);
  const totalPaid = financialRows.reduce((sum, row) => sum + row.paid, 0);
  const totalRemaining = financialRows.reduce((sum, row) => sum + row.remaining, 0);

  const tabs: { id: PatientDetailTab; label: string; icon: typeof CalendarRange }[] = [
    { id: "medical", label: t("tabMedical"), icon: CalendarRange },
    { id: "appointments", label: t("tabAppointments"), icon: CalendarPlus },
    { id: "financials", label: t("tabFinancials"), icon: Wallet },
  ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="w-full space-y-5"
      >
        <header className="rounded-2xl border border-subtle bg-surface p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="text-start">
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-semibold text-accent">
                  {initials}
                </div>
                <div>
                  <h1 className="font-arabic text-2xl font-bold text-primary">{patient.name}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    {patient.phoneNumber}
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-subtle bg-base/50 px-3 py-1 text-xs font-medium text-muted">
                  {t("pillVisits", { count: totalVisits })}
                </span>
                <span className="rounded-full border border-subtle bg-base/50 px-3 py-1 text-xs font-medium text-muted">
                  {t("pillBalance", {
                    amount: formatMoney(patient.totalBalanceDue, locale),
                  })}
                </span>
                <span className="rounded-full border border-subtle bg-base/50 px-3 py-1 text-xs font-medium text-muted">
                  {lastVisit
                    ? t("pillLastVisit", {
                        date: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Africa/Cairo",
                        }).format(new Date(lastVisit)),
                      })
                    : t("pillNoVisit")}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent-success/35 bg-accent-success/15 px-4 py-2.5 text-sm font-medium text-accent-success transition hover:bg-accent-success/20"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t("whatsappNow")}
              </a>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                {t("bookAppointment")}
              </button>
              {!compact && (
                <Link
                  href={backHref}
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-muted transition hover:text-accent"
                >
                  {t("backToPatients")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="flex gap-1 rounded-xl border border-subtle bg-surface/70 p-1" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm",
                  activeTab === tab.id ? "bg-accent/15 text-accent" : "text-muted hover:text-primary",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-subtle bg-surface p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-start"
            >
              {activeTab === "medical" ? (
                <div className="grid gap-4 lg:grid-cols-5">
                  <section className="rounded-xl border border-subtle bg-base/40 p-4 lg:col-span-2">
                    <h3 className="mb-2 text-sm font-semibold text-primary">{t("doctorNotes")}</h3>
                    <textarea
                      readOnly
                      value={patient.notes ?? ""}
                      placeholder={t("doctorNotesPlaceholder")}
                      rows={10}
                      className="w-full resize-none rounded-xl border border-subtle bg-base/30 p-3 text-sm leading-relaxed text-primary placeholder:text-muted focus:outline-none"
                    />
                  </section>
                  <section className="rounded-xl border border-subtle bg-base/40 p-4 lg:col-span-3">
                    <h3 className="mb-3 text-sm font-semibold text-primary">{t("medicalImages")}</h3>
                    <PatientVisualEhr
                      patientId={patient.id}
                      patientName={patient.name}
                      tenantId={tenantId}
                      initialMedia={initialMedia}
                      compact
                    />
                  </section>
                </div>
              ) : activeTab === "appointments" ? (
                <div className="space-y-4">
                  {visits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-subtle bg-base/40 px-4 py-12 text-center text-sm text-muted">
                      {t("appointmentsEmpty")}
                    </div>
                  ) : (
                    <ul className="space-y-4 border-s-2 border-subtle ps-4">
                      {visits.map((visit) => {
                        const status = STATUS_STYLES[visit.status];
                        return (
                          <li key={visit.id} className="relative">
                            <span className="absolute -start-[22px] top-2 h-3 w-3 rounded-full bg-accent" />
                            <article className="rounded-xl border border-subtle bg-base/40 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-primary">{visit.serviceName}</p>
                                  <p className="mt-1 text-xs text-muted">
                                    {formatAppointmentDateLong(visit.appointmentDate, locale)} ·{" "}
                                    {formatAppointmentTime(visit.appointmentDate, locale)}
                                  </p>
                                </div>
                                <span
                                  className={[
                                    "rounded-full px-2.5 py-1 text-xs font-medium",
                                    status.bg,
                                    status.text,
                                  ].join(" ")}
                                >
                                  {tStatus(visit.status)}
                                </span>
                              </div>
                              {visit.doctorNotes ? (
                                <p className="mt-3 rounded-lg bg-surface/60 p-3 text-sm text-muted">
                                  {visit.doctorNotes}
                                </p>
                              ) : null}
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-subtle bg-base/40 p-3">
                      <p className="text-xs text-muted">{t("totalCost")}</p>
                      <p className="mt-1 text-base font-semibold text-primary">
                        {formatMoney(totalCost, locale)} {t("currency")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-subtle bg-base/40 p-3">
                      <p className="text-xs text-muted">{t("totalPaid")}</p>
                      <p className="mt-1 text-base font-semibold text-status-completed">
                        {formatMoney(totalPaid, locale)} {t("currency")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-subtle bg-base/40 p-3">
                      <p className="text-xs text-muted">{t("remainingBalance")}</p>
                      <p
                        className={[
                          "mt-1 text-base font-semibold",
                          totalRemaining > 0 ? "text-accent-danger" : "text-primary",
                        ].join(" ")}
                      >
                        {formatMoney(totalRemaining, locale)} {t("currency")}
                      </p>
                    </div>
                  </div>

                  {financialRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-subtle bg-base/40 px-4 py-12 text-center text-sm text-muted">
                      {t("financialEmpty")}
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {financialRows.map((row) => (
                        <li key={row.id} className="rounded-xl border border-subtle bg-base/40 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-primary">{row.serviceName}</p>
                              <p className="mt-0.5 text-xs text-muted">
                                {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  timeZone: "Africa/Cairo",
                                }).format(new Date(row.appointmentDate))}
                              </p>
                            </div>
                            <span
                              className={[
                                "rounded-full px-2.5 py-1 text-xs font-medium",
                                STATUS_STYLES[row.status].bg,
                                STATUS_STYLES[row.status].text,
                              ].join(" ")}
                            >
                              {tStatus(row.status)}
                            </span>
                          </div>

                          <div className="grid gap-2 text-xs sm:grid-cols-3">
                            <p className="text-muted">
                              {t("invoiceTotal")}:{" "}
                              <span className="font-medium text-primary">
                                {formatMoney(row.total, locale)} {t("currency")}
                              </span>
                            </p>
                            <p className="text-muted">
                              {t("invoicePaid")}:{" "}
                              <span className="font-medium text-status-completed">
                                {formatMoney(row.paid, locale)} {t("currency")}
                              </span>
                            </p>
                            <p className="text-muted">
                              {t("invoiceRemaining")}:{" "}
                              <span
                                className={[
                                  "font-medium",
                                  row.remaining > 0 ? "text-accent-warning" : "text-primary",
                                ].join(" ")}
                              >
                                {formatMoney(row.remaining, locale)} {t("currency")}
                              </span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      <ScheduleSessionModal
        open={scheduleOpen}
        patientId={patient.id}
        patientName={patient.name}
        services={services}
        tenantId={tenantId}
        onClose={() => setScheduleOpen(false)}
      />
    </>
  );
}
