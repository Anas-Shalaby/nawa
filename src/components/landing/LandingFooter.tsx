"use client";

import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-zinc-200 px-6 py-10 dark:border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-start sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-primary">{t("brand")}</p>
        <p className="text-sm text-zinc-500 dark:text-muted">{t("tagline")}</p>
      </div>
    </footer>
  );
}
