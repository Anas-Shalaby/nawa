"use client";

import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";
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
    </div>
  );
}
