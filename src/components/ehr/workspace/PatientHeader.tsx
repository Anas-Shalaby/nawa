"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
} from "lucide-react";
import { usePermission } from "@/components/auth/PermissionProvider";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import {
  formatAppointmentTime,
} from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";
import type { PatientRecord, FamilyMember } from "@/lib/queries/patients";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { AppointmentStatus } from "@/lib/dashboard/types";

interface PatientHeaderProps {
  patient: PatientRecord;
  currentVisit: PatientVisitRecord | null;
  lastVisitDate: string | null;
  balanceDue: number;
  noShowCount: number;
  chronicDiseaseCount: number;
  allergyCount: number;
  backHref: string;
  compact: boolean;
  onEditPatient: () => void;
  onPrintFile: () => void;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-status-pending/15 text-status-pending",
  confirmed: "bg-status-confirmed/15 text-status-confirmed",
  checked_in: "bg-status-checkedIn/15 text-status-checkedIn",
  in_session: "bg-status-in_session/15 text-status-in_session",
  completed: "bg-status-completed/15 text-status-completed",
  no_show: "bg-accent-danger/15 text-accent-danger",
  canceled: "bg-muted/15 text-muted",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function shortPatientId(id: string): string {
  return `#P-${id.slice(-4).toUpperCase()}`;
}

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

export function PatientHeader({
  patient,
  currentVisit,
  lastVisitDate,
  balanceDue,
  noShowCount,
  chronicDiseaseCount,
  allergyCount,
  backHref,
  compact,
  onEditPatient,
  onPrintFile,
}: PatientHeaderProps) {
  const t = useTranslations("ehr");
  const tw = useTranslations("ehr.workspace");
  const tStatus = useTranslations("dashboard.detail.status");
  const locale = useLocale() as Locale;

  const canUpdate = usePermission("patients.update");

  const initials = getInitials(patient.name);
  const whatsappUrl = buildWhatsAppActionUrl(patient.phoneNumber, "appointment", {
    patientName: patient.name,
    locale,
  });

  return (
    <>
      <header className="sticky top-0 z-30 -mx-1 mb-6 border-b border-subtle/80 bg-base/90 px-1 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-start gap-3 text-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-lg font-semibold text-accent">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                {tw("label")}
              </p>
              <h1 className="truncate font-arabic text-2xl font-semibold tracking-tight text-primary">
                {patient.name}
              </h1>

              {/* Meta row */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="tabular-nums text-xs text-muted/70">
                  {shortPatientId(patient.id)}
                </span>
                <span dir="ltr" className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {patient.phoneNumber}
                </span>
                {lastVisitDate ? (
                  <span className="text-xs">
                    {tw("lastVisitLabel")}: {formatShortDate(lastVisitDate, locale)}
                  </span>
                ) : null}
              </div>

              {/* Visit status + badges */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {currentVisit ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted">
                      {currentVisit.serviceName} ·{" "}
                      {formatAppointmentTime(currentVisit.appointmentDate, locale)}
                    </span>
                    <span
                      className={[
                        "rounded-md px-2 py-0.5 text-[11px] font-medium",
                        STATUS_STYLES[currentVisit.status],
                      ].join(" ")}
                    >
                      {tStatus(currentVisit.status)}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm text-muted">{tw("noActiveVisit")}</span>
                )}

                {/* Balance badge */}
                {balanceDue > 0 ? (
                  <span className="rounded-md bg-accent-danger/10 px-2 py-0.5 text-[11px] font-semibold text-accent-danger">
                    {formatMoney(balanceDue, locale)} {t("currency")}
                  </span>
                ) : null}

                {/* Allergy badge */}
                {allergyCount > 0 ? (
                  <span className="rounded-md bg-accent-danger/10 px-2 py-0.5 text-[11px] font-semibold text-accent-danger">
                    {tw("allergies")}
                  </span>
                ) : null}

                {/* Chronic disease badge */}
                {chronicDiseaseCount > 0 ? (
                  <span className="rounded-md bg-accent-warning/10 px-2 py-0.5 text-[11px] font-semibold text-accent-warning">
                    {tw("chronicDiseases")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end hide-on-print">
            <a
              href={`tel:${patient.phoneNumber}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:text-accent-success"
              aria-label={tw("callPatient")}
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {tw("callPatient")}
            </a>

            {canUpdate ? (
              <button
                type="button"
                onClick={onEditPatient}
                className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:text-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {tw("editPatient")}
              </button>
            ) : null}

            <button
              type="button"
              onClick={onPrintFile}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:text-primary"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              {tw("printFile")}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:text-accent-success"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {t("whatsapp")}
            </a>
          </div>
        </div>
      </header>

      {!compact ? (
        <div className="mb-6 hide-on-print">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent"
          >
            {t("backToPatients")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      ) : null}
    </>
  );
}
