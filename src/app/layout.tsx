import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: { locale: string };
};

export const viewport: Viewport = {
  themeColor: "#6C5CE7",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });

  return {
    title: t("appTitle"),
    description: t("appDescription"),
    applicationName: "Nawa",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "نواة",
    },
    icons: {
      icon: [
        { url: "/icons/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [
        { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
