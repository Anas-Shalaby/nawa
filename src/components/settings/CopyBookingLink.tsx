"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

interface CopyBookingLinkProps {
  slug: string;
}

export function CopyBookingLink({ slug }: CopyBookingLinkProps) {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const origin = window.location.origin;
    const url = `${origin}/${locale}/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("copyFallback"), url);
    }
  }

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5">
      <p className="mb-1 text-sm font-medium text-primary">{t("bookingLinkTitle")}</p>
      <p className="mb-4 text-sm text-muted">{t("bookingLinkHint")}</p>

      <div className="mb-4 rounded-xl border border-subtle bg-base px-4 py-3 text-sm text-muted">
        <span dir="ltr" className="break-all font-mono text-primary">
          {typeof window !== "undefined"
            ? `${window.location.origin}/${locale}/${slug}`
            : `/${locale}/${slug}`}
        </span>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className={[
          "inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
          copied
            ? "bg-accent-success/15 text-accent-success"
            : "bg-accent/15 text-accent hover:bg-accent/25",
        ].join(" ")}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" aria-hidden />
            {t("copied")}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" aria-hidden />
            {t("copyLink")}
          </>
        )}
      </button>
    </div>
  );
}
