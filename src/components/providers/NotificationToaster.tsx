"use client";

import { useLocale } from "next-intl";
import { Toaster } from "sonner";
import { localeDirection, type Locale } from "@/i18n/routing";

export function NotificationToaster() {
  const locale = useLocale() as Locale;
  const dir = localeDirection[locale];

  return (
    <Toaster
      theme="dark"
      dir={dir}
      position={dir === "rtl" ? "top-left" : "top-right"}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group !bg-surface/95 !border-subtle/80 !text-primary !shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl",
          title: "!text-sm !font-semibold",
          description: "!text-xs !text-muted",
          closeButton: "!border-subtle/80 !bg-elevated !text-muted hover:!text-primary",
        },
      }}
    />
  );
}
