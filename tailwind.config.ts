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
        base: "#0A0A0F",
        surface: "#14141F",
        elevated: "#1E1E2E",
        subtle: "#2A2A3C",
        primary: "#F0F0F5",
        muted: "#8888A0",
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
