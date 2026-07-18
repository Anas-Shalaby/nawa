import { InteractiveAgendaCanvas } from "@/components/agenda/InteractiveAgendaCanvas";
import { fetchWorkingHours } from "@/actions/workingHours";
import { fetchUpcomingAgenda } from "@/lib/queries/agenda";
import { fetchPatients } from "@/lib/queries/patients";
import { fetchDashboardServices } from "@/lib/queries/services";
import { getTranslations } from "next-intl/server";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

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
  const gate = await requirePagePermission("/dashboard/upcoming");
  if (!gate.allowed) return gate.ui;

  const [appointments, services, patients, workingHours] = await Promise.all([
    fetchUpcomingAgenda(),
    fetchDashboardServices(),
    fetchPatients(),
    fetchWorkingHours(),
  ]);

  const activePatients = patients
    .filter((patient) => !patient.isArchived)
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      phoneNumber: patient.phoneNumber,
    }));

  return (
    <InteractiveAgendaCanvas
      appointments={appointments}
      services={services}
      patients={activePatients}
      workingHours={workingHours}
    />
  );
}
