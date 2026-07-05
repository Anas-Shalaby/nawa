"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-subtle/60 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 text-start sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="logo" width={40} height={36} />
          <p className="text-sm font-medium">{t("brand")}</p>
        </div>
        <p className="text-sm text-muted">{t("tagline")}</p>
      </div>
    </footer>
  );
}
