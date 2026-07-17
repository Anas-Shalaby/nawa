import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="border-t border-subtle/70 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-12"
          />
          <div>
            <p className="text-sm font-semibold text-primary">{t("brand")}</p>
            <p className="text-xs text-muted">{t("tagline")}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label={t("navLabel")}>
          <a
            href="#features"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {t("features")}
          </a>
          <a
            href="#pricing"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {t("pricing")}
          </a>
          <Link
            href="/register?plan=free_6mo"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-muted transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {t("start")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
