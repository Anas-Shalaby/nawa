import { IBM_Plex_Sans_Arabic, JetBrains_Mono } from "next/font/google";
import { requireSuperAdmin } from "@/lib/super-admin/auth";
import "../../globals.css";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${arabic.variable} ${mono.variable} font-[family-name:var(--font-arabic)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
