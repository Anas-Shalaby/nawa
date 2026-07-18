import { fetchWorkingHours } from "@/actions/workingHours";
import { ScheduleSettingsShell } from "@/components/settings/ScheduleSettingsShell";
import { getTranslations } from "next-intl/server";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "availability" });

  return {
    title: t("metaTitle"),
    description: t("canvasSubtitle"),
  };
}

export default async function ScheduleSettingsPage() {
  const gate = await requirePagePermission("/dashboard/settings/schedule");
  if (!gate.allowed) return gate.ui;

  const days = await fetchWorkingHours();
  return <ScheduleSettingsShell initialDays={days} />;
}
