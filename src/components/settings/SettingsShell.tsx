"use client";

import { useTranslations } from "next-intl";
import { CalendarClock, ChevronLeft, Settings2, UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ClinicSettings } from "@/lib/queries/settings";
import { CopyBookingLink } from "./CopyBookingLink";

interface SettingsShellProps {
  settings: ClinicSettings;
}

export function SettingsShell({ settings }: SettingsShellProps) {
  const t = useTranslations("settings");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-start">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <Settings2 className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Nawa
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{settings.clinicName}</p>
      </div>

      <CopyBookingLink slug={settings.slug} />

      <div className="mt-6 space-y-3">
        <Link
          href="/dashboard/settings/profile"
          className="flex items-center justify-between rounded-2xl border border-subtle/70 bg-surface/50 px-4 py-4 text-start transition hover:border-accent/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <UserRound className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-primary">{t("profileLinkTitle")}</p>
              <p className="text-xs text-muted">{t("profileLinkHint")}</p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted rtl:rotate-180" aria-hidden />
        </Link>

        <Link
          href="/dashboard/settings/availability"
          className="flex items-center justify-between rounded-2xl border border-subtle/70 bg-surface/50 px-4 py-4 text-start transition hover:border-accent/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <CalendarClock className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-primary">{t("availabilityLinkTitle")}</p>
              <p className="text-xs text-muted">{t("availabilityLinkHint")}</p>
            </div>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
