import { AnalyticsDashboardShell } from "@/components/analytics/AnalyticsDashboardShell";
import { fetchDashboardAnalytics } from "@/lib/queries/analytics";
import { getTranslations } from "next-intl/server";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.analyticsPage" });
  return { title: t("metaTitle") };
}

function parseRange(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const days = Number(raw);
  return [7, 30, 90].includes(days) ? days : 30;
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { range?: string | string[] };
}) {
  const gate = await requirePagePermission("/dashboard/analytics");
  if (!gate.allowed) return gate.ui;

  const { locale } = await params;
  const analytics = await fetchDashboardAnalytics(locale, parseRange(searchParams.range));

  return <AnalyticsDashboardShell analytics={analytics} />;
}
