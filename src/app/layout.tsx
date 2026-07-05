import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });

  return {
    title: t("appTitle"),
    description: t("appDescription"),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
