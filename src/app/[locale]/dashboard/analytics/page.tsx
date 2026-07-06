import { AnalyticsDashboardShell } from "@/components/analytics/AnalyticsDashboardShell";
import { fetchDashboardAnalytics } from "@/lib/queries/analytics";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.analyticsPage" });
  return { title: t("metaTitle") };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const analytics = await fetchDashboardAnalytics(locale);

  return <AnalyticsDashboardShell analytics={analytics} />;
}
