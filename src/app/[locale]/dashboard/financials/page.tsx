import { FinancialsShell } from "@/components/financials/FinancialsShell";
import { fetchFinancialOverview } from "@/lib/queries/financials";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "financials" });
  return { title: t("metaTitle") };
}

export default async function FinancialsPage() {
  const overview = await fetchFinancialOverview();
  return <FinancialsShell overview={overview} />;
}
