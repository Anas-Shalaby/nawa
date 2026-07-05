import { getTranslations } from "next-intl/server";
import { LandingPage } from "@/components/landing/LandingPage";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: "landing.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return <LandingPage />;
}
