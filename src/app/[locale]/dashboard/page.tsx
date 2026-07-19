import { ClinicOsShell } from "@/components/dashboard/today/ClinicOsShell";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";
import { fetchMissionControlSnapshot } from "@/lib/queries/missionControlSnapshot";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.clinicOs" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage() {
  const gate = await requirePagePermission("/dashboard");
  if (!gate.allowed) return gate.ui;

  const snapshot = await fetchMissionControlSnapshot();

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <ClinicOsShell {...snapshot} />
    </div>
  );
}
