"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function LandingNav() {
  const t = useTranslations("landing.nav");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-subtle/60 dark:bg-base/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <span className="text-sm font-bold text-accent">N</span>
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-primary">
            {t("brand")}
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <a
            href="#features"
            className="hidden text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-muted dark:hover:text-primary sm:inline"
          >
            {t("features")}
          </a>
          <a
            href="#pricing"
            className="hidden text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-muted dark:hover:text-primary sm:inline"
          >
            {t("pricing")}
          </a>
          <Link
            href="/register"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("cta")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
