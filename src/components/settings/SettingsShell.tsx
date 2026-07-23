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
import { Card } from "@/components/ui/card";

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
    <Link href={href} className="block group h-full">
      <Card className="flex h-full flex-col p-5 hover:bg-elevated/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 transition-transform group-hover:scale-105 group-hover:bg-accent/15">
            <Icon className="h-6 w-6 text-accent" aria-hidden />
          </div>
          <div className="rounded-full bg-surface p-1.5 transition-colors group-hover:bg-subtle">
            <ChevronLeft className="h-4 w-4 text-muted rtl:rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden />
          </div>
        </div>
        <div className="mt-5">
          <p className="text-base font-semibold text-primary">{title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{hint}</p>
        </div>
      </Card>
    </Link>
  );
}

export function SettingsShell({ settings }: SettingsShellProps) {
  const t = useTranslations("settings");
  const canManageClinic = usePermission("clinic.manage");
  const canManageRoles = usePermission("team.roles");
  const canBookingLink = usePermission("booking.link");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <EntityContextHeader
          entityLabel={t("entityLabel")}
          title={t("title")}
          subtitle={settings.clinicName}
          icon={Settings2}
        />
      </div>

      {canBookingLink ? (
        <div className="mb-10">
          <CopyBookingLink slug={settings.slug} />
        </div>
      ) : null}

      <div className="space-y-12">
        {(canManageClinic || canManageRoles) && (
          <section>
            <div className="mb-5 flex items-center gap-3 border-b border-subtle/50 pb-3">
              <Building2 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-primary">
                {t("sectionClinic")}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>
        )}

        {canManageRoles ? (
          <section>
            <div className="mb-5 flex items-center gap-3 border-b border-subtle/50 pb-3">
              <UserCog className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-primary">
                {t("sectionTeam")}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <SettingsCard
                href="/dashboard/settings/roles"
                title={t("rolesTitle")}
                hint={t("rolesHint")}
                icon={UserCog}
              />
            </div>
          </section>
        ) : null}

        <section>
          <div className="mb-5 flex items-center gap-3 border-b border-subtle/50 pb-3">
            <UserRound className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">
              {t("sectionAccount")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SettingsCard
              href="/dashboard/account"
              title={t("accountTitle")}
              hint={t("accountHint")}
              icon={UserRound}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
