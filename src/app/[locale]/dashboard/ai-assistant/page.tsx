import { getTranslations } from "next-intl/server";
import { ComingSoonPlaceholder } from "@/components/dashboard/ComingSoonPlaceholder";
import { requirePagePermission } from "@/lib/auth/requirePagePermission";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "comingSoon.aiAssistant" });
  return { title: t("metaTitle") };
}

export default async function AiAssistantPage() {
  const gate = await requirePagePermission("/dashboard/ai-assistant");
  if (!gate.allowed) return gate.ui;

  const t = await getTranslations("comingSoon");
  const feature = await getTranslations("comingSoon.aiAssistant");

  return (
    <ComingSoonPlaceholder
      title={feature("title")}
      description={feature("description")}
      badge={t("badge")}
      icon="bot"
    />
  );
}
