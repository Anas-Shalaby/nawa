"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  Palette,
  Phone,
  Shield,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { changeOwnPassword } from "@/actions/changeOwnPassword";
import { logoutClinic } from "@/actions/logoutClinic";
import { AppThemeToggle } from "@/components/theme/AppThemeToggle";
import { EntityContextHeader } from "@/components/settings/EntityContextHeader";
import type { AccountIdentity } from "@/lib/queries/accountIdentity";

interface AccountShellProps {
  identity: AccountIdentity;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function AccountShell({ identity }: AccountShellProps) {
  const t = useTranslations("accountSettings");
  const tRoles = useTranslations("teamOps.roles");
  const [passwordPending, startPasswordTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    startPasswordTransition(async () => {
      const result = await changeOwnPassword({
        currentPassword,
        newPassword,
      });
      if (!result.success) {
        toast.error(result.error ?? t("passwordError"));
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("passwordChanged"));
    });
  }

  const roleLabel = tRoles(identity.role);
  const statusLabel =
    identity.membershipStatus === "suspended"
      ? t("statusSuspended")
      : identity.membershipStatus === "invited"
        ? t("statusInvited")
        : t("statusActive");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <EntityContextHeader
        entityLabel={t("entityLabel")}
        title={t("title")}
        subtitle={t("subtitleNamed", { name: identity.displayName })}
        icon={UserRound}
        breadcrumb={{ href: "/dashboard/settings", label: t("backToSettings") }}
      />

      <section className="mb-6 rounded-2xl border border-subtle/70 bg-surface/80 p-6 text-start md:p-8">
        <div className="mb-5 flex flex-wrap items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-lg font-semibold text-accent"
            aria-hidden
          >
            {initialsFromName(identity.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("identityTitle")}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold text-primary">
              {identity.displayName}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("identityHint")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {roleLabel}
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                  identity.membershipStatus === "active"
                    ? "border-accent-success/30 bg-accent-success/10 text-accent-success"
                    : identity.membershipStatus === "suspended"
                      ? "border-accent-danger/30 bg-accent-danger/10 text-accent-danger"
                      : "border-subtle bg-elevated text-muted",
                ].join(" ")}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-subtle bg-base/40 px-4 py-3">
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {t("clinicLabel")}
            </dt>
            <dd className="text-sm font-medium text-primary">{identity.clinicName}</dd>
          </div>
          <div className="rounded-xl border border-subtle bg-base/40 px-4 py-3">
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              {t("roleLabel")}
            </dt>
            <dd className="text-sm font-medium text-primary">{roleLabel}</dd>
          </div>
          <div className="rounded-xl border border-subtle bg-base/40 px-4 py-3">
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {t("emailLabel")}
            </dt>
            <dd className="break-all text-sm font-medium text-primary" dir="ltr">
              {identity.email ?? t("notSet")}
            </dd>
          </div>
          <div className="rounded-xl border border-subtle bg-base/40 px-4 py-3">
            <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {t("phoneLabel")}
            </dt>
            <dd className="text-sm font-medium text-primary" dir="ltr">
              {identity.phone ?? t("notSet")}
            </dd>
          </div>
          {identity.department ? (
            <div className="rounded-xl border border-subtle bg-base/40 px-4 py-3 sm:col-span-2">
              <dt className="mb-1 text-xs font-medium text-muted">
                {t("departmentLabel")}
              </dt>
              <dd className="text-sm font-medium text-primary">
                {identity.department}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="mb-6 rounded-2xl border border-subtle/70 bg-surface/80 p-6 text-start md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-accent" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-primary">{t("appearanceTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted">{t("appearanceSubtitle")}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-base/40 px-4 py-3">
          <p className="text-sm text-primary">{t("themeLabel")}</p>
          <AppThemeToggle />
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-subtle/70 bg-surface/80 p-6 text-start md:p-8">
        <div className="mb-5 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-primary">{t("passwordTitle")}</h2>
            <p className="mt-0.5 text-xs text-muted">{t("passwordSubtitle")}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="account-current-password" className="mb-1.5 block text-sm font-medium text-muted">
              {t("currentPassword")}
            </label>
            <input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="account-new-password" className="mb-1.5 block text-sm font-medium text-muted">
              {t("newPassword")}
            </label>
            <input
              id="account-new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="mb-1.5 block text-sm font-medium text-muted">
              {t("confirmPassword")}
            </label>
            <input
              id="account-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={
              passwordPending || !currentPassword || !newPassword || !confirmPassword
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-accent/40 hover:bg-accent/10 disabled:opacity-50"
          >
            {passwordPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-4 w-4 text-accent" aria-hidden />
            )}
            {passwordPending ? t("passwordSaving") : t("passwordSave")}
          </button>
        </div>
      </section>

      <form action={logoutClinic}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent-danger/30 bg-accent-danger/10 px-4 py-2.5 text-sm font-semibold text-accent-danger transition hover:bg-accent-danger/15"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("logout")}
        </button>
      </form>
    </div>
  );
}
