"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { slideInX } from "@/lib/i18n/motion";
import type { Locale } from "@/i18n/routing";

interface AuthFormPanelProps {
  children: React.ReactNode;
}

export function AuthFormPanel({ children }: AuthFormPanelProps) {
  const locale = useLocale() as Locale;
  const tBrand = useTranslations("common");
  const tShared = useTranslations("auth.shared");

  return (
    <div
      className={[
        "order-1 flex min-h-screen flex-col bg-slate-950 px-6 py-8 md:order-2 md:px-10 md:py-10 lg:px-14",
        "rtl:md:order-1",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image
            src="/icons/icon-192.png"
            alt={tShared("logoAlt")}
            width={36}
            height={36}
            className="h-9 w-12 rounded-xl"
          />
          <span className="text-sm font-semibold text-slate-100">
            {tBrand("nawa")}
          </span>
        </Link>
        <LocaleSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, x: slideInX(locale, 24) }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 items-center justify-center py-8 md:py-12"
      >
        <div className="w-full max-w-md">{children}</div>
      </motion.div>
    </div>
  );
}
