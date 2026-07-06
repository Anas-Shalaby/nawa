import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PatientDetailShell } from "@/components/ehr/PatientDetailShell";
import { PatientFinancialCard } from "@/components/patients/PatientFinancialCard";
import { fetchPatientMedia } from "@/lib/queries/patientMedia";
import { fetchPatientPayments } from "@/lib/queries/patientPayments";
import { fetchPatientById, fetchPatientTenantId } from "@/lib/queries/patients";
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
  const [patient, tenantId, media, payments, services, visits] = await Promise.all([
    fetchPatientById(id),
    fetchPatientTenantId(),
    fetchPatientMedia(id),
    fetchPatientPayments(id),
    fetchDashboardServices(),
    fetchPatientVisitHistory(id),
  ]);

  if (!patient) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <PatientDetailShell
          patient={patient}
          tenantId={tenantId}
          initialMedia={media}
          initialVisits={visits}
          services={services}
        />
        <PatientFinancialCard
          patientId={patient.id}
          patientName={patient.name}
          phoneNumber={patient.phoneNumber}
          initialBalanceDue={patient.totalBalanceDue}
          initialPayments={payments}
        />
      </div>
    </div>
  );
}
