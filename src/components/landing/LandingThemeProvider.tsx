"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LandingTheme = "light" | "dark";

const STORAGE_KEY = "nawa-landing-theme";

interface LandingThemeContextValue {
  theme: LandingTheme;
  setTheme: (theme: LandingTheme) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const LandingThemeContext = createContext<LandingThemeContextValue | null>(null);

function readStoredTheme(): LandingTheme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<LandingTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setMounted(true);
  }, []);

  const setTheme = useCallback((nextTheme: LandingTheme) => {
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
    <LandingThemeContext.Provider value={value}>
      <div
        className={[
          "min-h-screen bg-base text-primary",
          theme === "light" ? "landing-light" : "",
        ].join(" ")}
        data-landing-theme={theme}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const context = useContext(LandingThemeContext);
  if (!context) {
    throw new Error("useLandingTheme must be used within LandingThemeProvider");
  }
  return context;
}
