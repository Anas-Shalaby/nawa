"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppTheme } from "./AppThemeProvider";

export function AppThemeToggle() {
  const t = useTranslations("dashboard.sidebar");
  const { theme, toggleTheme, mounted } = useAppTheme();

  const isLight = theme === "light";
  const label = isLight ? t("themeDark") : t("themeLight");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={[
        "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-subtle/70 bg-surface/90",
        "text-primary transition",
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
