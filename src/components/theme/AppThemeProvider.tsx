"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AppTheme = "light" | "dark";

const STORAGE_KEY = "nawa-app-theme";

interface AppThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setMounted(true);
  }, []);

  // Sync tokens onto <html> so portaled UI (drawers/modals) inherits light/dark.
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("app-light", theme === "light");
    root.dataset.appTheme = theme;
    return () => {
      root.classList.remove("app-light");
      delete root.dataset.appTheme;
    };
  }, [theme, mounted]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = current === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, mounted }),
    [theme, setTheme, toggleTheme, mounted],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <div
        className={[
          "min-h-screen bg-base text-primary",
          theme === "light" ? "app-light" : "",
        ].join(" ")}
        data-app-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
