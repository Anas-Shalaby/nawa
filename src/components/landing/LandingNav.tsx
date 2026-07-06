"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { LandingThemeToggle } from "./LandingThemeToggle";

export function LandingNav() {
  const t = useTranslations("landing.nav");

  return (
    <header className="sticky top-0 z-50 border-b border-subtle/60 bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt="logo"
            className="h-9 w-12"
            width={36}
            height={36}
          />
          <span className="text-sm font-semibold">{t("brand")}</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#features"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface/60 hover:text-primary sm:inline"
          >
            {t("features")}
          </a>
          <a
            href="#value"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface/60 hover:text-primary sm:inline"
          >
            {t("value")}
          </a>
          <a
            href="#pricing"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface/60 hover:text-primary sm:inline"
          >
            {t("pricing")}
          </a>
          <LandingThemeToggle />
          <LocaleSwitcher />
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
