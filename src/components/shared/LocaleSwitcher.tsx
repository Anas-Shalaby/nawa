"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  const nextLocale: Locale = locale === "ar" ? "en" : "ar";

  function handleSwitch() {
    router.replace(pathname, { locale: nextLocale });
  }

  if (!routing.locales.includes(locale)) return null;

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="rounded-lg border border-subtle bg-surface/90 px-3 py-1.5 text-xs font-medium text-primary shadow-sm backdrop-blur-sm transition hover:bg-elevated"
      aria-label={`Switch to ${nextLocale === "ar" ? "Arabic" : "English"}`}
    >
      {t("switchLocale")}
    </button>
  );
}
