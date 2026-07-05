import type { Locale } from "@/i18n/routing";
import { localeDirection } from "@/i18n/routing";

/** Returns a horizontal slide offset that respects reading direction. */
export function slideInX(locale: Locale, distance = 16): number {
  return localeDirection[locale] === "rtl" ? -distance : distance;
}

export function isRtlLocale(locale: string): boolean {
  return localeDirection[locale as Locale] === "rtl";
}
