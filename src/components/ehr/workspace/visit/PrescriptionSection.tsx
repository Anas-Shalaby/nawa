"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PrescriptionBuilder } from "@/components/clinical/PrescriptionBuilder";
import type { PrescriptionRecord, MedicineFavoriteRecord, PrescriptionTemplateRecord, ChronicMedicationRecord } from "@/lib/clinical/prescriptionTypes";

interface PrescriptionSectionProps {
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  clinicName: string;
  specialty?: string;
  clinicPhone?: string;
  clinicLocation?: string;
  logoUrl?: string | null;
  prescriptions: PrescriptionRecord[];
  favorites: MedicineFavoriteRecord[];
  clinicTemplates: PrescriptionTemplateRecord[];
  chronicMedications: ChronicMedicationRecord[];
  onPrescriptionSaved: (payload: any) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function PrescriptionSection({
  patientId,
  patientName,
  patientPhone,
  doctorName,
  clinicName,
  specialty,
  clinicPhone,
  clinicLocation,
  logoUrl,
  prescriptions,
  favorites,
  clinicTemplates,
  chronicMedications,
  onPrescriptionSaved,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: PrescriptionSectionProps) {
  const t = useTranslations("ehr.workspace.visit");

  // Summary of the latest prescription if one was saved during this visit
  const latestRx = prescriptions[0];
  const summary = latestRx
    ? latestRx.lines.map((l) => l.medicineName).join(" · ")
    : "";

  return (
    <section
      id="visit-prescription"
      onClick={() => {
        if (isCollapsed) {
          onFocus();
        }
      }}
      className={[
        "rounded-2xl border bg-surface/40 p-5 transition-all duration-200 text-start",
        isActive
          ? "border-accent ring-1 ring-accent/20"
          : "border-subtle/70 hover:border-subtle",
        isCollapsed ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            7
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("step7")}</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="rounded-lg p-1 text-muted hover:bg-elevated hover:text-primary hide-on-print"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Card Body */}
      {!isCollapsed ? (
        <div className="space-y-4">
          <p className="text-xs text-muted">{t("stepDescription7")}</p>
          <PrescriptionBuilder
            open={!isCollapsed}
            onClose={onToggleCollapse}
            layout="inline"
            patientId={patientId}
            patientName={patientName}
            patientPhone={patientPhone}
            doctorName={doctorName}
            clinicName={clinicName}
            specialty={specialty}
            clinicPhone={clinicPhone}
            clinicLocation={clinicLocation}
            logoUrl={logoUrl}
            previousPrescriptions={prescriptions}
            favorites={favorites}
            clinicTemplates={clinicTemplates}
            chronicMedications={chronicMedications}
            onSaved={onPrescriptionSaved}
          />
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary || <span className="text-muted/60">{t("none")}</span>}
          </p>
        </div>
      )}
    </section>
  );
}
