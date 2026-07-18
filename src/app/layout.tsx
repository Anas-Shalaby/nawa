import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#6C5CE7",
  colorScheme: "dark",
};

/** Static favicon + PWA links — files live in /public and /src/app/icon.png */
export const metadata: Metadata = {
  applicationName: "Nawah",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "نواة",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
