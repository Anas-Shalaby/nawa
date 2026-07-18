"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { addTeamMember } from "@/actions/manageTeam";
import type { TeamRole } from "@/lib/team/types";

const INVITE_ROLES: TeamRole[] = [
  "doctor",
  "receptionist",
  "nurse",
  "assistant",
  "lab",
  "manager",
  "admin",
];

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function InviteMemberModal({ open, onClose, onCreated }: InviteMemberModalProps) {
  const t = useTranslations("teamOps.invite");
  const tRoles = useTranslations("teamOps.roles");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("receptionist");
  const [department, setDepartment] = useState("");
  const [withLogin, setWithLogin] = useState(true);
  const [pending, startTransition] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setDepartment("");
    setRole("receptionist");
    setWithLogin(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await addTeamMember({
        displayName: name,
        role,
        department: department || undefined,
        email: email || undefined,
        withLogin,
      });
      if (!result.success) {
        toast.error(result.error ?? t("error"));
        return;
      }
      if (result.tempPassword) {
        setTempPassword(result.tempPassword);
        toast.success(t("successWithLogin"));
      } else {
        toast.success(t("success"));
        resetForm();
        onCreated();
        onClose();
      }
    });
  }

  async function copyPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  function finishInvite() {
    setTempPassword(null);
    resetForm();
    onCreated();
    onClose();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (tempPassword) finishInvite();
              else onClose();
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-member-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative w-full max-w-md rounded-2xl border border-subtle bg-surface p-5 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="text-start">
                <h2 id="invite-member-title" className="text-lg font-semibold text-primary">
                  {tempPassword ? t("credsTitle") : t("title")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {tempPassword ? t("credsSubtitle") : t("subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (tempPassword) finishInvite();
                  else onClose();
                }}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                  <p className="text-xs text-muted">{t("tempPasswordLabel")}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <code className="text-sm font-semibold text-primary">{tempPassword}</code>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-primary"
                      aria-label={t("copy")}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted">{t("shareHint")}</p>
                <button
                  type="button"
                  onClick={finishInvite}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {t("done")}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="invite-name" className="mb-1.5 block text-sm font-medium text-muted">
                    {t("nameLabel")}
                  </label>
                  <input
                    id="invite-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder={t("namePlaceholder")}
                  />
                </div>

                <div>
                  <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-muted">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={withLogin}
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder={t("emailPlaceholder")}
                  />
                </div>

                <label className="flex items-start gap-2.5 text-start text-sm text-primary">
                  <input
                    type="checkbox"
                    checked={withLogin}
                    onChange={(e) => setWithLogin(e.target.checked)}
                    className="mt-1 rounded border-subtle"
                  />
                  <span>
                    <span className="font-medium">{t("withLogin")}</span>
                    <span className="mt-0.5 block text-xs text-muted">{t("withLoginHint")}</span>
                  </span>
                </label>

                <div>
                  <label htmlFor="invite-role" className="mb-1.5 block text-sm font-medium text-muted">
                    {t("roleLabel")}
                  </label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as TeamRole)}
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {tRoles(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-dept" className="mb-1.5 block text-sm font-medium text-muted">
                    {t("departmentLabel")}
                  </label>
                  <input
                    id="invite-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder={t("departmentPlaceholder")}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-medium text-muted transition hover:text-primary"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                    {pending ? t("submitting") : withLogin ? t("submitInvite") : t("submit")}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
