import { UpcomingAppointmentsShell } from "@/components/agenda/UpcomingAppointmentsShell";
import { fetchUpcomingAgenda } from "@/lib/queries/agenda";
import { fetchPatients } from "@/lib/queries/patients";
import { fetchDashboardServices } from "@/lib/queries/services";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "agenda" });
  return { title: t("metaTitle") };
}

export default async function UpcomingPage() {
  const [appointments, services, patients] = await Promise.all([
    fetchUpcomingAgenda(),
    fetchDashboardServices(),
    fetchPatients(),
  ]);

  const activePatients = patients
    .filter((patient) => !patient.isArchived)
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      phoneNumber: patient.phoneNumber,
    }));

  return (
    <UpcomingAppointmentsShell
      appointments={appointments}
      services={services}
      patients={activePatients}
    />
  );
}
