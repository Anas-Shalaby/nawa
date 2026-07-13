import { redirect } from "next/navigation";

/** Legacy route — schedule canvas lives at /dashboard/settings/schedule */
export default async function AvailabilitySettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/settings/schedule`);
}
