"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Phone,
  UserRound,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { PatientMediaRecord } from "@/lib/media/types";
import type { PatientRecord } from "@/lib/queries/patients";
import type { DashboardService } from "@/lib/dashboard/types";
import { ScheduleSessionButton } from "@/components/dashboard/ScheduleSessionButton";
import { WhatsAppActionMenu } from "@/components/whatsapp/WhatsAppActionMenu";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import { PatientDetailTabs, type PatientDetailTab } from "./PatientDetailTabs";
import { PatientVisitHistory } from "./PatientVisitHistory";
import { PatientVisualEhr } from "./PatientVisualEhr";

interface PatientDetailShellProps {
  patient: PatientRecord;
  tenantId: string;
  initialMedia: PatientMediaRecord[];
  initialVisits?: PatientVisitRecord[];
  services: DashboardService[];
  backHref?: string;
  compact?: boolean;
}

export function PatientDetailShell({
  patient,
  tenantId,
  initialMedia,
  initialVisits,
  services,
  backHref = "/dashboard/patients",
  compact = false,
}: PatientDetailShellProps) {
  const t = useTranslations("ehr");
  const tPatients = useTranslations("patients");
  const locale = useLocale() as Locale;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("general");

  const strikeLabel =
    patient.noShowCount === 1
      ? tPatients("strikes", { count: patient.noShowCount })
      : tPatients("strikesPlural", { count: patient.noShowCount });

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "flex flex-col rounded-2xl border border-subtle bg-surface/50",
        compact ? "min-h-[420px]" : "min-h-[520px]",
      ].join(" ")}
    >
      <header className="border-b border-subtle px-5 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 text-start">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15">
              <UserRound className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">
                {patient.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                {patient.phoneNumber}
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </p>
            </div>
          </div>

          {!compact && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent"
            >
              {t("backToPatients")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {patient.isArchived && (
            <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium text-muted">
              {tPatients("archivedBadge")}
            </span>
          )}
          {patient.noShowCount === 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-danger/10 px-2.5 py-1 text-xs font-medium text-accent-danger">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {tPatients("warningBadge")}
            </span>
          )}
          {patient.noShowCount > 1 && (
            <span className="rounded-full bg-accent-danger/10 px-2.5 py-1 text-xs font-medium text-accent-danger">
              {strikeLabel}
            </span>
          )}
        </div>

        <PatientDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "general" ? (
          <div className="space-y-5 text-start">
            <ScheduleSessionButton
              patientId={patient.id}
              patientName={patient.name}
              services={services}
              tenantId={tenantId}
            />

            <WhatsAppActionMenu
              phoneNumber={patient.phoneNumber}
              patientName={patient.name}
              amountDue={patient.totalBalanceDue}
            />

            {patient.notes && (
              <div className="rounded-xl border border-subtle bg-base/40 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {t("crmNotes")}
                </p>
                <p className="text-sm leading-relaxed text-primary">
                  {patient.notes}
                </p>
              </div>
            )}

            {!compact && (
              <p className="text-xs text-muted">
                {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                  dateStyle: "long",
                  timeZone: "Africa/Cairo",
                }).format(new Date(patient.createdAt))}
              </p>
            )}
          </div>
        ) : activeTab === "record" ? (
          <PatientVisitHistory
            patientId={patient.id}
            initialVisits={initialVisits}
            enabled={activeTab === "record"}
            compact={compact}
          />
        ) : (
          <PatientVisualEhr
            patientId={patient.id}
            patientName={patient.name}
            tenantId={tenantId}
            initialMedia={initialMedia}
            compact={compact}
          />
        )}
      </div>
    </motion.section>
  );
}
