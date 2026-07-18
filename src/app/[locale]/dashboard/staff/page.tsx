import { getTranslations } from "next-intl/server";
import { TeamOpsShell } from "@/components/team/TeamOpsShell";
import { fetchTeamOpsSnapshot } from "@/lib/queries/teamOpsSnapshot";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teamOps" });
  return {
    title: t("metaTitle"),
    description: t("subtitle"),
  };
}

export default async function StaffPage() {
  const gate = await requirePagePermission("/dashboard/staff");
  if (!gate.allowed) return gate.ui;

  const snapshot = await fetchTeamOpsSnapshot();
  return <TeamOpsShell snapshot={snapshot} />;
}
