"use client";

import { useTranslations } from "next-intl";
import { PatientVisualEhr } from "@/components/ehr/PatientVisualEhr";
import type { PatientMediaRecord } from "@/lib/media/types";

interface MediaGalleryProps {
  patientId: string;
  patientName: string;
  tenantId: string;
  initialMedia: PatientMediaRecord[];
}

export function MediaGallery({
  patientId,
  patientName,
  tenantId,
  initialMedia,
}: MediaGalleryProps) {
  const tw = useTranslations("ehr.workspace");

  return (
    <section id="workspace-media" className="mb-10 text-start">
      <h2 className="mb-1 text-sm font-semibold text-primary">{tw("mediaTitle")}</h2>
      <p className="mb-4 text-xs text-muted">{tw("mediaHint")}</p>
      <PatientVisualEhr
        patientId={patientId}
        patientName={patientName}
        tenantId={tenantId}
        initialMedia={initialMedia}
      />
    </section>
  );
}
