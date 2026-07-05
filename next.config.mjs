import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

export default withNextIntl(nextConfig);
