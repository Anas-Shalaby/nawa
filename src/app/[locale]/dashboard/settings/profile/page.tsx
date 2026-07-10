import { ProfileSettingsShell } from "@/components/settings/ProfileSettingsShell";
import { fetchDoctorProfile } from "@/lib/queries/doctorProfile";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileSettings" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function DoctorProfileSettingsPage() {
  const profile = await fetchDoctorProfile();
  return <ProfileSettingsShell profile={profile} />;
}
