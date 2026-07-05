import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14: keep Supabase out of server bundles to avoid stale vendor-chunk errors in dev.
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
