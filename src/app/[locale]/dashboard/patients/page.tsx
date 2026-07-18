import { getTranslations } from "next-intl/server";
import { PatientsDirectoryShell } from "@/components/patients/PatientsDirectoryShell";
import { fetchPatients } from "@/lib/queries/patients";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "patients" });

  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function PatientsPage() {
  const gate = await requirePagePermission("/dashboard/patients");
  if (!gate.allowed) return gate.ui;

  const patients = await fetchPatients();

  return <PatientsDirectoryShell patients={patients} />;
}
