"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  KeyRound,
  Loader2,
  Shield,
  Sparkles,
  UserX,
  X,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  resetTeamMemberPassword,
  setTeamMemberSuspended,
  updateTeamMemberRole,
} from "@/actions/manageTeam";
import { Link } from "@/i18n/navigation";
import { useAppTheme } from "@/components/theme/AppThemeProvider";
import { localeDirection, type Locale } from "@/i18n/routing";
import type { TeamMemberView, TeamRole } from "@/lib/team/types";
import { LiveStatusBadge } from "./LiveStatusBadge";

const EDIT_ROLES: TeamRole[] = [
  "doctor",
  "receptionist",
  "nurse",
  "assistant",
  "lab",
  "manager",
  "admin",
  "cashier",
  "intern",
];

function generateSuggestedPassword(): string {
  const chunk = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `Nw-${chunk}A1`;
}

interface MemberProfileDrawerProps {
  member: TeamMemberView | null;
  canManage: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function MemberProfileDrawer({
  member,
  canManage,
  currentUserId,
  onClose,
  onUpdated,
}: MemberProfileDrawerProps) {
  const t = useTranslations("teamOps.profile");
  const tRoles = useTranslations("teamOps.roles");
  const tStatus = useTranslations("teamOps.status");
  const locale = useLocale() as Locale;
  const dir = localeDirection[locale];
  const slideFrom = dir === "rtl" ? "-100%" : "100%";
  const { theme } = useAppTheme();
  const [role, setRole] = useState<TeamRole>("receptionist");
  const [pending, startTransition] = useTransition();
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const isSelf = Boolean(
    member && currentUserId && member.userId && member.userId === currentUserId,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setPasswordPanelOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setSavedPassword(null);
    }
  }, [member?.id]);

  function saveRole() {
    if (!member || !canManage) return;
    startTransition(async () => {
      const result = await updateTeamMemberRole(member.id, role);
      if (!result.success) {
        toast.error(result.error ?? t("roleError"));
        return;
      }
      toast.success(t("roleSaved"));
      onUpdated();
    });
  }

  function toggleSuspend() {
    if (!member || !canManage) return;
    const next = !member.isSuspended;
    startTransition(async () => {
      const result = await setTeamMemberSuspended(member.id, next);
      if (!result.success) {
        toast.error(result.error ?? t("suspendError"));
        return;
      }
      toast.success(next ? t("suspended") : t("unsuspended"));
      onUpdated();
    });
  }

  function fillSuggestedPassword() {
    const suggested = generateSuggestedPassword();
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setSavedPassword(null);
  }

  function submitPasswordReset() {
    if (!member || !canManage || isSelf) return;

    if (newPassword.trim().length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    startTransition(async () => {
      const result = await resetTeamMemberPassword(member.id, newPassword);
      if (!result.success) {
        toast.error(result.error ?? t("resetError"));
        return;
      }
      setSavedPassword(result.tempPassword ?? newPassword.trim());
      toast.success(t("resetSuccess"));
    });
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {member ? (
        <>
          <motion.button
            key="member-profile-backdrop"
            type="button"
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={[
              "fixed inset-0 z-[200] backdrop-blur-sm",
              theme === "light" ? "bg-base/70" : "bg-black/45",
            ].join(" ")}
            onClick={onClose}
          />
          <motion.aside
            key="member-profile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-profile-title"
            data-app-theme={theme}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={[
              "fixed inset-y-0 end-0 z-[210] flex h-dvh w-full max-w-md flex-col",
              "border-s border-subtle bg-surface text-primary",
              theme === "light"
                ? "app-light shadow-[0_0_48px_rgba(15,23,42,0.12)]"
                : "shadow-[0_0_60px_rgba(0,0,0,0.35)]",
            ].join(" ")}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-subtle px-5 py-4">
              <div className="min-w-0 text-start">
                <h2
                  id="member-profile-title"
                  className="truncate text-lg font-semibold text-primary"
                >
                  {member.displayName}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {tRoles(member.role)}
                  {member.department ? ` · ${member.department}` : ""}
                </p>
                <div className="mt-2">
                  <LiveStatusBadge status={member.status} />
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <section className="space-y-2 text-start">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("access")}
                </h3>
                <p className="text-sm text-primary">{member.email ?? t("noEmail")}</p>
                <p className="text-xs text-muted">
                  {member.isLinked ? t("linked") : t("rosterOnly")}
                  {member.isSuspended ? ` · ${t("suspendedBadge")}` : ""}
                </p>
              </section>

              {canManage && member.id !== "primary-doctor" ? (
                <section className="space-y-2 text-start">
                  <label
                    htmlFor="member-role"
                    className="text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {t("roleLabel")}
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="member-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as TeamRole)}
                      className="min-w-0 flex-1 rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      {EDIT_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {tRoles(r)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={pending || role === member.role}
                      onClick={saveRole}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {pending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" aria-hidden />
                      )}
                      {t("saveRole")}
                    </button>
                  </div>
                </section>
              ) : null}

              {member.id !== "primary-doctor" ? (
                <section className="space-y-3">
                  <h3 className="text-start text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("security")}
                  </h3>

                  {isSelf ? (
                    <div className="rounded-2xl border border-subtle bg-elevated/40 p-4 text-start">
                      <p className="text-sm text-primary">{t("selfPasswordHint")}</p>
                      <Link
                        href="/dashboard/account"
                        onClick={onClose}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm font-medium text-primary transition hover:border-accent/30"
                      >
                        <KeyRound className="h-4 w-4 text-accent" aria-hidden />
                        {t("goToAccountPassword")}
                      </Link>
                    </div>
                  ) : canManage ? (
                    <div className="space-y-3">
                      {!passwordPanelOpen ? (
                        <button
                          type="button"
                          disabled={!member.isLinked}
                          onClick={() => {
                            setPasswordPanelOpen(true);
                            setSavedPassword(null);
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle px-3 py-2.5 text-sm font-medium text-primary transition hover:border-accent/30 hover:bg-elevated disabled:opacity-50"
                        >
                          <KeyRound className="h-4 w-4 text-accent" aria-hidden />
                          {t("resetPassword")}
                        </button>
                      ) : (
                        <div className="space-y-3 rounded-2xl border border-subtle bg-elevated/30 p-4 text-start">
                          <p className="text-xs text-muted">{t("passwordFormHint")}</p>
                          <div>
                            <label
                              htmlFor="member-new-password"
                              className="mb-1.5 block text-xs font-medium text-muted"
                            >
                              {t("newPassword")}
                            </label>
                            <input
                              id="member-new-password"
                              type="text"
                              autoComplete="new-password"
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                setSavedPassword(null);
                              }}
                              className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="member-confirm-password"
                              className="mb-1.5 block text-xs font-medium text-muted"
                            >
                              {t("confirmPassword")}
                            </label>
                            <input
                              id="member-confirm-password"
                              type="text"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setSavedPassword(null);
                              }}
                              className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={pending}
                              onClick={fillSuggestedPassword}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:bg-elevated hover:text-primary"
                            >
                              <Sparkles className="h-3.5 w-3.5" aria-hidden />
                              {t("suggestPassword")}
                            </button>
                            <button
                              type="button"
                              disabled={pending || !member.isLinked}
                              onClick={submitPasswordReset}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                            >
                              {pending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <KeyRound className="h-4 w-4" aria-hidden />
                              )}
                              {t("savePassword")}
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setPasswordPanelOpen(false);
                              setNewPassword("");
                              setConfirmPassword("");
                              setSavedPassword(null);
                            }}
                            className="text-xs text-muted transition hover:text-primary"
                          >
                            {t("cancelPassword")}
                          </button>
                        </div>
                      )}

                      {savedPassword ? (
                        <div className="space-y-2 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-start">
                          <p className="text-xs font-semibold text-accent">
                            {t("tempCredsTitle")}
                          </p>
                          <p className="text-xs text-muted">{t("tempCredsKeepOpen")}</p>
                          <div className="flex items-center justify-between gap-2">
                            <code className="break-all text-sm text-primary">
                              {savedPassword}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyText(savedPassword)}
                              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-primary"
                              aria-label={t("copy")}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        disabled={pending}
                        onClick={toggleSuspend}
                        className={[
                          "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:opacity-50",
                          member.isSuspended
                            ? "border-accent-success/30 bg-accent-success/10 text-accent-success"
                            : "border-accent-danger/30 bg-accent-danger/10 text-accent-danger",
                        ].join(" ")}
                      >
                        <UserX className="h-4 w-4" aria-hidden />
                        {member.isSuspended ? t("unsuspend") : t("suspend")}
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-2xl border border-subtle bg-elevated/40 px-4 py-3 text-start text-xs text-muted">
                <p>
                  {t("statusLine", {
                    status: tStatus(member.status),
                    appointments: member.todayAppointments,
                    waiting: member.waitingPatients,
                  })}
                </p>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
