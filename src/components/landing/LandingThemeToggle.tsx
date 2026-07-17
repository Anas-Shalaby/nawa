"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useLandingTheme } from "./LandingThemeProvider";

export function LandingThemeToggle() {
  const t = useTranslations("landing.nav");
  const { theme, toggleTheme, mounted } = useLandingTheme();

  const isLight = theme === "light";
  const label = isLight ? t("themeDark") : t("themeLight");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={[
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-subtle/70 bg-surface/90",
        "text-primary shadow-sm backdrop-blur-md transition",
        "hover:border-accent/30 hover:bg-elevated/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
      ].join(" ")}
    >
      {mounted ? (
        isLight ? (
          <Moon className="h-4 w-4 text-accent" aria-hidden />
        ) : (
          <Sun className="h-4 w-4 text-accent" aria-hidden />
        )
      ) : (
        <Sun className="h-4 w-4 text-accent" aria-hidden />
      )}
    </button>
  );
}
