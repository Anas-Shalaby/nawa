"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

function localeLabels(
  t: (key: "ar" | "en" | "arSecondary" | "enSecondary") => string,
  code: Locale,
) {
  if (code === "ar") {
    return { native: t("ar"), secondary: t("arSecondary") };
  }
  return { native: t("en"), secondary: t("enSecondary") };
}

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common.localeSwitcher");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!routing.locales.includes(locale)) return null;

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    router.replace(pathname, { locale: nextLocale });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("label")}
        className={[
          "flex items-center gap-2 rounded-xl border border-subtle/70 bg-surface/90 px-3 py-2",
          "text-sm text-primary shadow-sm backdrop-blur-md transition",
          "hover:border-accent/30 hover:bg-elevated/90",
          open ? "border-accent/40 bg-elevated/90" : "",
        ].join(" ")}
      >
        <Globe className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
        <span className="hidden font-medium sm:inline">
          {localeLabels(t, locale).native}
        </span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t("label")}
          className={[
            "absolute end-0 top-[calc(100%+0.5rem)] z-[120] min-w-[11.5rem] overflow-hidden",
            "rounded-xl border border-subtle/80 bg-elevated/95 p-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl",
          ].join(" ")}
        >
          {routing.locales.map((code) => {
            const isActive = code === locale;
            const labels = localeLabels(t, code);

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(code)}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-start transition",
                  isActive
                    ? "bg-accent/15 text-primary"
                    : "text-muted hover:bg-surface hover:text-primary",
                ].join(" ")}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{labels.native}</span>
                  <span className="text-[11px] text-muted">{labels.secondary}</span>
                </span>
                {isActive ? (
                  <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
