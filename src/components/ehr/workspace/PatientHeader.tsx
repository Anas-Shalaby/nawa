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
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  pending: "bg-status-pending/15 text-status-pending border-status-pending/20",
  confirmed: "bg-status-confirmed/15 text-status-confirmed border-status-confirmed/20",
  checked_in: "bg-status-checkedIn/15 text-status-checkedIn border-status-checkedIn/20",
  in_session: "bg-status-in_session/15 text-status-in_session border-status-in_session/20",
  completed: "bg-status-completed/15 text-status-completed border-status-completed/20",
  no_show: "bg-accent-danger/15 text-accent-danger border-accent-danger/20",
  canceled: "bg-muted/15 text-muted border-muted/20",
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
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 100], [0, -10]);
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  const initials = getInitials(patient.name);
  const whatsappUrl = buildWhatsAppActionUrl(patient.phoneNumber, "appointment", {
    patientName: patient.name,
    locale,
  });

  return (
    <>
      <motion.header 
        style={{ y: headerY, opacity: headerOpacity }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-4 z-40 mx-2 mb-8 glass-panel-heavy rounded-2xl px-5 py-4 shadow-xl transition-all duration-300"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Identity */}
          <div className="flex min-w-0 items-center gap-4 text-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 text-xl font-bold text-accent shadow-sm premium-glow">
              {initials}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-arabic text-2xl font-bold tracking-tight text-primary">
                  {patient.name}
                </h1>
                {currentVisit ? (
                    <Badge variant="outline" className={STATUS_STYLES[currentVisit.status]}>
                      {tStatus(currentVisit.status)}
                    </Badge>
                ) : null}
              </div>

              {/* Meta row */}
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="font-mono text-[11px] font-semibold text-accent/80">
                  {shortPatientId(patient.id)}
                </span>
                <span dir="ltr" className="inline-flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {patient.phoneNumber}
                </span>
                {lastVisitDate ? (
                  <span className="text-[11px] font-medium bg-elevated/40 px-2 py-0.5 rounded-md">
                    {tw("lastVisitLabel")}: {formatShortDate(lastVisitDate, locale)}
                  </span>
                ) : null}
              </div>

              {/* Badges */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {/* Balance badge */}
                {balanceDue > 0 ? (
                  <Badge variant="destructive" className="animate-pulse">
                    {formatMoney(balanceDue, locale)} {t("currency")} {tw("label")} {/* Or specific label */}
                  </Badge>
                ) : null}

                {/* Allergy badge */}
                {allergyCount > 0 ? (
                  <Badge variant="destructive">
                    {allergyCount} {tw("allergies")}
                  </Badge>
                ) : null}

                {/* Chronic disease badge */}
                {chronicDiseaseCount > 0 ? (
                  <Badge variant="warning">
                    {chronicDiseaseCount} {tw("chronicDiseases")}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end hide-on-print">
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${patient.phoneNumber}`} aria-label={tw("callPatient")}>
                <Phone className="h-4 w-4 me-2" aria-hidden />
                {tw("callPatient")}
              </a>
            </Button>

            {canUpdate ? (
              <Button variant="secondary" size="sm" onClick={onEditPatient}>
                <Pencil className="h-4 w-4 me-2" aria-hidden />
                {tw("editPatient")}
              </Button>
            ) : null}

            <Button variant="ghost" size="sm" onClick={onPrintFile}>
              <Printer className="h-4 w-4" aria-hidden />
            </Button>

            <Button variant="premium" size="sm" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 me-2 text-accent-success" aria-hidden />
                {t("whatsapp")}
              </a>
            </Button>
          </div>
        </div>
      </motion.header>

      {!compact ? (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 mx-2 hide-on-print"
        >
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-accent"
          >
            {t("backToPatients")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </motion.div>
      ) : null}
    </>
  );
}
