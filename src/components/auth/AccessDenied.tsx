"use client";

import { ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AccessDenied({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations("accessDenied");

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-danger/10 text-accent-danger">
        <ShieldOff className="h-7 w-7" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">403</p>
      <h1 className="mt-2 text-2xl font-semibold text-primary">{title ?? t("title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {description ?? t("description")}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {t("backHome")}
        </Link>
        <a
          href={`mailto:?subject=${encodeURIComponent(t("requestSubject"))}&body=${encodeURIComponent(t("requestBody"))}`}
          className="inline-flex items-center rounded-xl border border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-primary transition hover:border-accent/30"
        >
          {t("requestAccess")}
        </a>
      </div>
    </div>
  );
}
