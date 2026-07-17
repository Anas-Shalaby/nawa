import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PatientDetailShell } from "@/components/ehr/PatientDetailShell";
import { fetchDoctorProfile } from "@/lib/queries/doctorProfile";
import { fetchPatientMedia } from "@/lib/queries/patientMedia";
import { fetchPatientPayments } from "@/lib/queries/patientPayments";
import {
  fetchPatientById,
  fetchPatientFamily,
  fetchPatientTenantId,
} from "@/lib/queries/patients";
import { fetchPatientVisitHistory } from "@/lib/queries/patientVisits";
import { fetchDashboardServices } from "@/lib/queries/services";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const patient = await fetchPatientById(id);
  const t = await getTranslations({ locale, namespace: "ehr" });

  return {
    title: patient ? `${patient.name} — ${t("metaTitle")}` : t("metaTitle"),
  };
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, tenantId, media, payments, services, visits, profile, family] =
    await Promise.all([
      fetchPatientById(id),
      fetchPatientTenantId(),
      fetchPatientMedia(id),
      fetchPatientPayments(id),
      fetchDashboardServices(),
      fetchPatientVisitHistory(id),
      fetchDoctorProfile(),
      fetchPatientFamily(id),
    ]);

  if (!patient) {
    notFound();
  }

  return (
    <div className="w-full">
      <PatientDetailShell
        patient={patient}
        tenantId={tenantId}
        initialMedia={media}
        initialVisits={visits}
        initialPayments={payments}
        services={services}
        doctorName={profile.doctorName}
        clinicName={profile.clinicName}
        specialty={profile.specialty}
        family={family}
      />
    </div>
  );
}
