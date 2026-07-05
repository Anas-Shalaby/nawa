import { getTranslations } from "next-intl/server";
import { ComingSoonPlaceholder } from "@/components/dashboard/ComingSoonPlaceholder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "comingSoon.marketing" });
  return { title: t("metaTitle") };
}

export default async function MarketingPage() {
  const t = await getTranslations("comingSoon");
  const feature = await getTranslations("comingSoon.marketing");

  return (
    <ComingSoonPlaceholder
      title={feature("title")}
      description={feature("description")}
      badge={t("badge")}
      icon="megaphone"
    />
  );
}
