import { InventoryShell } from "@/components/inventory/InventoryShell";
import { fetchInventoryOverview } from "@/lib/queries/inventory";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inventory" });
  return { title: t("metaTitle") };
}

export default async function InventoryPage() {
  const overview = await fetchInventoryOverview();
  return <InventoryShell overview={overview} />;
}
