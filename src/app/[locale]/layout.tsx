import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { routing, localeDirection, type Locale } from "@/i18n/routing";
import { GlobalLocaleSwitcher } from "@/components/shared/GlobalLocaleSwitcher";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
});

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
