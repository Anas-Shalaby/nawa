"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { LandingThemeToggle } from "./LandingThemeToggle";

const NAV_LINKS = [
  { href: "#value", key: "value" as const },
  { href: "#tour", key: "tour" as const },
  { href: "#features", key: "features" as const },
  { href: "#pricing", key: "pricing" as const },
] as const;

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    openButtonRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-subtle/60 bg-base/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5 rounded-xl pe-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Image
            src="/icons/icon-192.png"
            alt=""
            className="h-9 w-12"
            width={36}
            height={36}
          />
          <span className="text-sm font-semibold">{t("brand")}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("primary")}>
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm text-muted transition hover:bg-surface/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <LandingThemeToggle />
          <LocaleSwitcher />
          <Link
            href="/register"
            className="hidden min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:inline-flex"
          >
            {t("cta")}
          </Link>
          <button
            ref={openButtonRef}
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-subtle bg-surface/70 text-primary transition hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 lg:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={menuId}
          className="border-t border-subtle/60 bg-base/95 px-6 py-4 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <div className="flex justify-end">
              <button
                ref={closeButtonRef}
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-subtle text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label={t("closeMenu")}
                onClick={closeMenu}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-primary transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                onClick={closeMenu}
              >
                {t(item.key)}
              </a>
            ))}
            <Link
              href="/register"
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              onClick={closeMenu}
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
