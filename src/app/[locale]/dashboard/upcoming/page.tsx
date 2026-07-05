import { AgendaShell } from "@/components/agenda/AgendaShell";
import { fetchUpcomingAgenda } from "@/lib/queries/agenda";
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
  const appointments = await fetchUpcomingAgenda();
  return <AgendaShell appointments={appointments} />;
}
