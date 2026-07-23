import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { GlobalLocaleSwitcher } from "@/components/shared/GlobalLocaleSwitcher";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: "#6C5CE7",
  colorScheme: "dark",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });

  return {
    title: t("appTitle"),
    description: t("appDescription"),
    applicationName: "Nawah",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.png", type: "image/png", sizes: "192x192" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/favicon.ico"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "نواة",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const locale = params.locale as Locale;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirection[locale];
  const fontClass =
    locale === "ar"
      ? `${ibmPlexArabic.variable} font-[family-name:var(--font-arabic)]`
      : `${inter.variable} font-[family-name:var(--font-sans)]`;

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.variable} ${ibmPlexArabic.variable} ${fontClass}`}>
        <NextIntlClientProvider messages={messages}>
          <GlobalLocaleSwitcher />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
