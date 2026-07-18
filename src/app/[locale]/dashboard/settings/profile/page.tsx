import { redirect } from "next/navigation";

export default async function DoctorProfileSettingsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/settings/clinic`);
}
