"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarPlus,
  FilePlus2,
  FileText,
  Loader2,
  MessageCircle,
  Phone,
  Printer,
  UserX,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { givePatientStrike } from "@/actions/managePatients";
import type { Locale } from "@/i18n/routing";
import type { PatientMediaRecord } from "@/lib/media/types";
import type { PatientRecord } from "@/lib/queries/patients";
import type { DashboardService } from "@/lib/dashboard/types";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import {
  formatAppointmentDateLong,
  formatAppointmentTime,
} from "@/lib/datetime/cairo";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { RecordPaymentModal } from "@/components/patients/RecordPaymentModal";
import { PrescriptionBuilder } from "@/components/clinical/PrescriptionBuilder";
import { PatientVisualEhr } from "./PatientVisualEhr";

interface PatientDetailShellProps {
  patient: PatientRecord;
  tenantId: string;
  initialMedia: PatientMediaRecord[];
  initialVisits?: PatientVisitRecord[];
  initialPayments: PatientPaymentRecord[];
  services: DashboardService[];
  doctorName: string;
  clinicName: string;
  specialty?: string;
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

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-status-pending/15 text-status-pending",
  confirmed: "bg-status-confirmed/15 text-status-confirmed",
  checked_in: "bg-status-checkedIn/15 text-status-checkedIn",
  in_session: "bg-status-in_session/15 text-status-in_session",
  completed: "bg-status-completed/15 text-status-completed",
  no_show: "bg-accent-danger/15 text-accent-danger",
  canceled: "bg-muted/15 text-muted",
};

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isFutureAppointment(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
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
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime(),
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
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime(),
    );
}

export function PatientDetailShell({
  patient,
  tenantId,
  initialMedia,
  initialVisits,
  initialPayments,
  services,
  doctorName,
  clinicName,
  specialty,
  backHref = "/dashboard/patients",
  compact = false,
}: PatientDetailShellProps) {
  const t = useTranslations("ehr");
  const tPatients = useTranslations("patients");
  const tStatus = useTranslations("dashboard.detail.status");
  const locale = useLocale() as Locale;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("medical");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = useState(false);
  const [strikeConfirmOpen, setStrikeConfirmOpen] = useState(false);
  const [noShowCount, setNoShowCount] = useState(patient.noShowCount);
  const [balanceDue, setBalanceDue] = useState(patient.totalBalanceDue);
  const [patientNotes, setPatientNotes] = useState(patient.notes ?? "");
  const [payments, setPayments] = useState(initialPayments);
  const [isStrikePending, startStrikeTransition] = useTransition();
  const visits = initialVisits ?? [];

  useEffect(() => {
    setNoShowCount(patient.noShowCount);
    setBalanceDue(patient.totalBalanceDue);
    setPatientNotes(patient.notes ?? "");
  }, [patient.id, patient.noShowCount, patient.totalBalanceDue, patient.notes]);

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  const totalVisits = visits.filter(
    (visit) => visit.status !== "canceled" && visit.status !== "no_show",
  ).length;
  const lastVisit = visits.find(
    (visit) => visit.status === "completed" || visit.status === "in_session",
  )?.appointmentDate ?? visits[0]?.appointmentDate ?? null;

  const initials = getInitials(patient.name);
  const whatsappUrl = buildWhatsAppActionUrl(patient.phoneNumber, "appointment", {
    patientName: patient.name,
    locale,
  });

  const sessionNotes = useMemo(
    () =>
      visits.filter(
        (visit) => visit.doctorNotes && visit.doctorNotes.trim().length > 0,
      ),
    [visits],
  );

  const financialRows = useMemo(
    () => buildFinancialRows(visits, payments),
    [visits, payments],
  );
  const totalPaid = financialRows.reduce((sum, row) => sum + row.paid, 0);
  const totalRemaining = Math.max(balanceDue, 0);

  const tabs: { id: PatientDetailTab; label: string }[] = [
    { id: "medical", label: t("tabMedical") },
    { id: "appointments", label: t("tabAppointments") },
    { id: "financials", label: t("tabFinancials") },
  ];

  function handleConfirmStrike() {
    if (isStrikePending || patient.isArchived) return;
    const previousCount = noShowCount;
    setStrikeConfirmOpen(false);
    setNoShowCount((current) => current + 1);

    startStrikeTransition(async () => {
      const result = await givePatientStrike(patient.id);
      if (!result.success) {
        setNoShowCount(previousCount);
        toast.error(tPatients("strikeError"), { description: result.error });
        return;
      }
      const count = result.newNoShowCount ?? previousCount + 1;
      setNoShowCount(count);
      toast.success(tPatients("strikeSuccess"), {
        description: tPatients("strikeSuccessHint", {
          name: patient.name,
          count,
        }),
      });
    });
  }

  function printPrescription(visit: PatientVisitRecord) {
    const dateLabel = formatAppointmentDateLong(visit.appointmentDate, locale);
    const html = `<!doctype html><html dir="rtl" lang="${locale}"><head><meta charset="utf-8"/><title>${t("prescriptionPrintTitle")}</title>
      <style>
        body{font-family:Tahoma,Arial,sans-serif;padding:32px;color:#111;background:#fff}
        h1{font-size:18px;margin:0 0 8px} .meta{color:#666;font-size:13px;margin-bottom:24px}
        .box{border:1px solid #ddd;border-radius:12px;padding:16px;white-space:pre-wrap;line-height:1.7}
      </style></head><body>
      <h1>${patient.name} — ${visit.serviceName}</h1>
      <p class="meta">${dateLabel} · ${formatAppointmentTime(visit.appointmentDate, locale)}</p>
      <div class="box">${(visit.doctorNotes ?? "").replace(/</g, "&lt;")}</div>
      </body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!win) {
      toast.error(t("printBlocked"));
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="w-full"
      >
        {/* Master header */}
        <header className="mb-6 flex flex-col gap-5 rounded-2xl border border-subtle bg-surface/90 p-6 shadow-sm backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 text-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-semibold text-accent ring-1 ring-accent/20">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-arabic text-2xl font-bold text-primary">
                {patient.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-1.5 text-sm text-muted" dir="ltr">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {patient.phoneNumber}
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-subtle px-2 py-1 text-[11px] font-medium text-muted transition hover:border-accent-success/40 hover:text-accent-success"
                >
                  <MessageCircle className="h-3 w-3" aria-hidden />
                  {t("whatsapp")}
                </a>
                {noShowCount > 0 ? (
                  <span className="rounded-full bg-accent-danger/10 px-2 py-0.5 text-[11px] font-medium text-accent-danger">
                    {tPatients("strikes", { count: noShowCount })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-stretch gap-2 lg:justify-end">
            <div className="min-w-[7.5rem] rounded-xl border border-subtle bg-elevated/60 px-3 py-2.5 text-start">
              <p className="text-[10px] text-muted">{t("statTotalVisits")}</p>
              <p className="mt-1 text-lg font-semibold text-primary">{totalVisits}</p>
            </div>
            <div className="min-w-[7.5rem] rounded-xl border border-subtle bg-elevated/60 px-3 py-2.5 text-start">
              <p className="text-[10px] text-muted">{t("statLastVisit")}</p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {lastVisit ? formatShortDate(lastVisit, locale) : t("pillNoVisit")}
              </p>
            </div>
            <div
              className={[
                "min-w-[7.5rem] rounded-xl px-3 py-2.5 text-start",
                balanceDue > 0
                  ? "border border-accent-danger/20 bg-accent-danger/10 text-accent-danger"
                  : "border border-subtle bg-elevated/60 text-primary",
              ].join(" ")}
            >
              <p
                className={[
                  "text-[10px]",
                  balanceDue > 0 ? "text-accent-danger/80" : "text-muted",
                ].join(" ")}
              >
                {t("statBalance")}
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoney(balanceDue, locale)}{" "}
                <span className="text-xs font-medium">{t("currency")}</span>
              </p>
            </div>
          </div>
        </header>

        {!compact ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent"
            >
              {t("backToPatients")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPrescriptionOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20"
              >
                <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
                {t("writePrescription")}
              </button>
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
              >
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
                {t("bookAppointment")}
              </button>
              {!patient.isArchived ? (
                <button
                  type="button"
                  disabled={isStrikePending}
                  onClick={() => setStrikeConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-accent-danger/25 bg-accent-danger/10 px-3 py-2 text-xs font-medium text-accent-danger transition hover:bg-accent-danger/20 disabled:opacity-50"
                >
                  {isStrikePending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <UserX className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {tPatients("giveStrike")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div
          className="relative mb-6 flex gap-1 rounded-2xl border border-subtle bg-surface p-1"
          role="tablist"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative z-10 flex-1 rounded-xl px-3 py-2.5 text-xs font-medium transition sm:text-sm",
                  active ? "text-accent" : "text-muted hover:text-primary",
                ].join(" ")}
              >
                {active ? (
                  <motion.span
                    layoutId="patientProfileActiveTab"
                    className="absolute inset-0 rounded-xl bg-accent/15"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-subtle bg-surface p-5 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-start"
            >
              {activeTab === "medical" ? (
                <div className="grid gap-4">
                  <section className="rounded-2xl border border-subtle bg-elevated/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-primary">
                        {t("doctorNotes")}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setPrescriptionOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent/20"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" aria-hidden />
                        {t("writePrescription")}
                      </button>
                    </div>
                    {sessionNotes.length === 0 && !patientNotes.trim() ? (
                      <p className="rounded-xl border border-dashed border-subtle px-4 py-10 text-center text-sm text-muted">
                        {t("doctorNotesPlaceholder")}
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {patientNotes.trim() ? (
                          <li className="rounded-xl border border-subtle bg-surface p-4">
                            <p className="mb-1 text-[11px] font-medium text-muted">
                              {t("crmNotes")}
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary">
                              {patientNotes}
                            </p>
                          </li>
                        ) : null}
                        {sessionNotes.map((visit) => (
                          <li
                            key={visit.id}
                            className="rounded-xl border border-subtle bg-surface p-4"
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-primary">
                                {visit.serviceName}
                              </p>
                              <p className="text-[11px] text-muted">
                                {formatShortDate(visit.appointmentDate, locale)}
                              </p>
                            </div>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                              {visit.doctorNotes}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-subtle bg-elevated/40 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-primary">
                        {t("pastPrescriptions")}
                      </h3>
                      {sessionNotes.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-subtle px-4 py-10 text-center text-sm text-muted">
                          {t("prescriptionsEmpty")}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {sessionNotes.map((visit) => (
                            <li
                              key={`rx-${visit.id}`}
                              className="flex items-start justify-between gap-3 rounded-xl border border-subtle bg-surface p-3"
                            >
                              <div className="min-w-0">
                                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                                  <FileText className="h-3.5 w-3.5 text-accent" aria-hidden />
                                  {visit.serviceName}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-muted">
                                  {visit.doctorNotes}
                                </p>
                                <p className="mt-1 text-[10px] text-muted">
                                  {formatShortDate(visit.appointmentDate, locale)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => printPrescription(visit)}
                                className="shrink-0 rounded-lg border border-subtle p-2 text-muted transition hover:border-accent/40 hover:text-accent"
                                aria-label={t("printPrescription")}
                              >
                                <Printer className="h-4 w-4" aria-hidden />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="rounded-2xl border border-subtle bg-elevated/40 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-primary">
                        {t("attachmentsTitle")}
                      </h3>
                      <PatientVisualEhr
                        patientId={patient.id}
                        patientName={patient.name}
                        tenantId={tenantId}
                        initialMedia={initialMedia}
                        compact
                      />
                    </section>
                  </div>
                </div>
              ) : null}

              {activeTab === "appointments" ? (
                <div>
                  {visits.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-subtle bg-elevated/30 px-4 py-14 text-center text-sm text-muted">
                      {t("appointmentsEmpty")}
                    </div>
                  ) : (
                    <ul className="divide-y divide-subtle overflow-hidden rounded-2xl border border-subtle">
                      {visits.map((visit) => {
                        const future = isFutureAppointment(visit.appointmentDate);
                        return (
                          <li
                            key={visit.id}
                            className="flex flex-wrap items-center justify-between gap-3 bg-elevated/20 px-4 py-3.5 transition hover:bg-elevated/50"
                          >
                            <div className="min-w-0 text-start">
                              <p className="text-sm font-semibold text-primary">
                                {visit.serviceName}
                              </p>
                              <p className="mt-0.5 text-xs text-muted">
                                {formatAppointmentDateLong(visit.appointmentDate, locale)} ·{" "}
                                {formatAppointmentTime(visit.appointmentDate, locale)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={[
                                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                  STATUS_STYLES[visit.status],
                                ].join(" ")}
                              >
                                {tStatus(visit.status)}
                              </span>
                              {future &&
                              visit.status !== "canceled" &&
                              visit.status !== "completed" &&
                              visit.status !== "no_show" ? (
                                <button
                                  type="button"
                                  onClick={() => setScheduleOpen(true)}
                                  className="rounded-lg border border-subtle px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-accent"
                                >
                                  {t("reschedule")}
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}

              {activeTab === "financials" ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-subtle bg-elevated/40 p-4">
                      <p className="text-xs text-muted">{t("totalPaid")}</p>
                      <p className="mt-1 text-2xl font-bold text-accent-success">
                        {formatMoney(totalPaid, locale)}{" "}
                        <span className="text-sm font-medium">{t("currency")}</span>
                      </p>
                    </div>
                    <div className="rounded-2xl border border-subtle bg-elevated/40 p-4">
                      <p className="text-xs text-muted">{t("remainingBalance")}</p>
                      <p
                        className={[
                          "mt-1 text-2xl font-bold",
                          totalRemaining > 0
                            ? "text-accent-danger"
                            : "text-primary",
                        ].join(" ")}
                      >
                        {formatMoney(totalRemaining, locale)}{" "}
                        <span className="text-sm font-medium">{t("currency")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={balanceDue <= 0}
                      onClick={() => setPaymentOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Wallet className="h-4 w-4" aria-hidden />
                      {t("addPayment")}
                    </button>
                  </div>

                  {financialRows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-subtle bg-elevated/30 px-4 py-12 text-center text-sm text-muted">
                      {t("financialEmpty")}
                    </div>
                  ) : (
                    <ul className="overflow-hidden rounded-2xl border border-subtle">
                      <li className="hidden grid-cols-4 gap-3 border-b border-subtle bg-elevated/60 px-4 py-2 text-[11px] font-medium text-muted sm:grid">
                        <span>{t("ledgerDate")}</span>
                        <span>{t("invoiceTotal")}</span>
                        <span>{t("invoicePaid")}</span>
                        <span>{t("invoiceRemaining")}</span>
                      </li>
                      {financialRows.map((row) => (
                        <li
                          key={row.id}
                          className="grid gap-2 border-b border-subtle px-4 py-3 last:border-b-0 sm:grid-cols-4 sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">
                              {formatShortDate(row.appointmentDate, locale)}
                            </p>
                            <p className="text-[11px] text-muted">{row.serviceName}</p>
                          </div>
                          <p className="text-sm text-primary">
                            <span className="sm:hidden text-[11px] text-muted">
                              {t("invoiceTotal")}:{" "}
                            </span>
                            {formatMoney(row.total, locale)} {t("currency")}
                          </p>
                          <p className="text-sm font-medium text-accent-success">
                            <span className="sm:hidden text-[11px] text-muted">
                              {t("invoicePaid")}:{" "}
                            </span>
                            {formatMoney(row.paid, locale)} {t("currency")}
                          </p>
                          <p
                            className={[
                              "text-sm font-medium",
                              row.remaining > 0
                                ? "text-accent-danger"
                                : "text-primary",
                            ].join(" ")}
                          >
                            <span className="sm:hidden text-[11px] text-muted">
                              {t("invoiceRemaining")}:{" "}
                            </span>
                            {formatMoney(row.remaining, locale)} {t("currency")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>

      <PrescriptionBuilder
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        patientId={patient.id}
        patientName={patient.name}
        patientPhone={patient.phoneNumber}
        doctorName={doctorName}
        clinicName={clinicName}
        specialty={specialty}
        onSaved={(formattedText) => {
          setPatientNotes((current) =>
            current.trim() ? `${current.trim()}\n\n${formattedText}` : formattedText,
          );
          setActiveTab("medical");
        }}
      />

      <ScheduleSessionModal
        open={scheduleOpen}
        patientId={patient.id}
        patientName={patient.name}
        services={services}
        tenantId={tenantId}
        onClose={() => setScheduleOpen(false)}
      />

      <RecordPaymentModal
        open={paymentOpen}
        patientId={patient.id}
        balanceDue={balanceDue}
        onClose={() => setPaymentOpen(false)}
        onRecorded={(newBalance) => {
          const paidNow = Math.max(0, balanceDue - newBalance);
          setBalanceDue(newBalance);
          setPayments((current) => [
            {
              id: `local-${Date.now()}`,
              amountPaid: paidNow,
              paidAt: new Date().toISOString(),
            },
            ...current,
          ]);
          toast.success(t("paymentRecorded"));
        }}
      />

      <AnimatePresence>
        {strikeConfirmOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="patient-strike-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-6 shadow-2xl shadow-black/40"
            >
              <h3
                id="patient-strike-title"
                className="text-start text-lg font-semibold text-primary"
              >
                {tPatients("strikeConfirmTitle")}
              </h3>
              <p className="mt-2 text-start text-sm text-muted">
                {tPatients("strikeConfirmBody", { name: patient.name })}
              </p>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStrikeConfirmOpen(false)}
                  className="rounded-xl border border-subtle px-4 py-2 text-sm font-medium text-primary transition hover:bg-elevated"
                >
                  {tPatients("strikeCancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStrike}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-danger px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <UserX className="h-4 w-4" aria-hidden />
                  {tPatients("strikeConfirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
