import type { Config } from "tailwindcss";

/**
 * Nawa Tailwind — logical properties only for spacing/positioning.
 * Use ms/me/ps/pe/start/end/text-start/text-end — never ml/mr/pl/pr/left/right.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base-rgb) / <alpha-value>)",
        surface: "rgb(var(--color-surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--color-elevated-rgb) / <alpha-value>)",
        subtle: "rgb(var(--color-subtle-rgb) / <alpha-value>)",
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        muted: "rgb(var(--color-muted-rgb) / <alpha-value>)",
        accent: {
          DEFAULT: "#6C5CE7",
          success: "#00CEC9",
          warning: "#FDCB6E",
          danger: "#FF6B6B",
        },
        status: {
          pending: "#6C5CE7",
          confirmed: "#00CEC9",
          checkedIn: "#74B9FF",
          in_session: "#A29BFE",
          completed: "#55EFC4",
        },
        booking: {
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          text: "#1A1A2E",
          muted: "#6B7280",
          accent: "#6C5CE7",
          "accent-light": "#EDE9FE",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "IBM Plex Sans Arabic", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      inset: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
