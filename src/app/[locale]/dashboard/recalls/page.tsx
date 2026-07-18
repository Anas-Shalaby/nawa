import { RecallsShell } from "@/components/recalls/RecallsShell";
import { fetchRecallPatients } from "@/lib/queries/recalls";
import { getTranslations } from "next-intl/server";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

const RECALL_MONTHS = 6;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recalls" });
  return { title: t("metaTitle") };
}

export default async function RecallsPage() {
  const gate = await requirePagePermission("/dashboard/recalls");
  if (!gate.allowed) return gate.ui;

  const patients = await fetchRecallPatients(RECALL_MONTHS);
  return <RecallsShell patients={patients} recallMonths={RECALL_MONTHS} />;
}
