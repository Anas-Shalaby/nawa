import { fetchWorkingHours } from "@/actions/workingHours";
import { AvailabilitySettingsShell } from "@/components/settings/AvailabilitySettingsShell";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale: params.locale, namespace: "availability" });

  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function AvailabilitySettingsPage() {
  const days = await fetchWorkingHours();

  return <AvailabilitySettingsShell initialDays={days} />;
}
