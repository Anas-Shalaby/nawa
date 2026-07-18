"use client";

import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarClock,
  ChevronLeft,
  Settings2,
  UserCog,
  UserRound,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ClinicSettings } from "@/lib/queries/settings";
import { Can } from "@/components/auth/Can";
import { usePermission } from "@/components/auth/PermissionProvider";
import { CopyBookingLink } from "./CopyBookingLink";
import { EntityContextHeader } from "./EntityContextHeader";

interface SettingsShellProps {
  settings: ClinicSettings;
}

function SettingsCard({
  href,
  title,
  hint,
  icon: Icon,
}: {
  href: string;
  title: string;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-subtle/70 bg-surface/50 px-4 py-4 text-start transition hover:border-accent/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
          <Icon className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <div>
          <p className="font-medium text-primary">{title}</p>
          <p className="text-xs text-muted">{hint}</p>
        </div>
      </div>
      <ChevronLeft className="h-5 w-5 text-muted rtl:rotate-180" aria-hidden />
    </Link>
  );
}

export function SettingsShell({ settings }: SettingsShellProps) {
  const t = useTranslations("settings");
  const canManageClinic = usePermission("clinic.manage");
  const canManageRoles = usePermission("team.roles");
  const canBookingLink = usePermission("booking.link");

  return (
    <div className="mx-auto max-w-3xl">
      <EntityContextHeader
        entityLabel={t("entityLabel")}
        title={t("title")}
        subtitle={settings.clinicName}
        icon={Settings2}
      />

      {canBookingLink ? (
        <div className="mb-6">
          <CopyBookingLink slug={settings.slug} />
        </div>
      ) : null}

      {(canManageClinic || canManageRoles) && (
        <>
          <div className="mb-3 text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("sectionClinic")}
            </p>
          </div>
          <div className="space-y-3">
            <Can permission="clinic.manage">
              <SettingsCard
                href="/dashboard/settings/clinic"
                title={t("clinicIdentityTitle")}
                hint={t("clinicIdentityHint")}
                icon={Building2}
              />
            </Can>
            <Can permission="clinic.manage">
              <SettingsCard
                href="/dashboard/settings/schedule"
                title={t("availabilityLinkTitle")}
                hint={t("availabilityLinkHint")}
                icon={CalendarClock}
              />
            </Can>
          </div>
        </>
      )}

      {canManageRoles ? (
        <>
          <div className="mb-3 mt-8 text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("sectionTeam")}
            </p>
          </div>
          <div className="space-y-3">
            <SettingsCard
              href="/dashboard/settings/roles"
              title={t("rolesTitle")}
              hint={t("rolesHint")}
              icon={UserCog}
            />
          </div>
        </>
      ) : null}

      <div className="mb-3 mt-8 text-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("sectionAccount")}
        </p>
      </div>
      <div className="space-y-3">
        <SettingsCard
          href="/dashboard/account"
          title={t("accountTitle")}
          hint={t("accountHint")}
          icon={UserRound}
        />
      </div>
    </div>
  );
}
