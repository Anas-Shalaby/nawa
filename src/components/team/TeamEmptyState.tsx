"use client";

import { Stethoscope, UserPlus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface TeamEmptyStateProps {
  canManage: boolean;
  onInvite: () => void;
  filtered?: boolean;
}

export function TeamEmptyState({ canManage, onInvite, filtered = false }: TeamEmptyStateProps) {
  const t = useTranslations("teamOps.empty");

  if (filtered) {
    return (
      <div className="rounded-2xl border border-dashed border-subtle bg-surface/40 px-6 py-16 text-center">
        <Users className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <p className="mt-3 text-sm font-medium text-primary">{t("filteredTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("filteredBody")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-subtle bg-surface/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Stethoscope className="h-7 w-7 text-accent" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-primary">{t("title")}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("body")}</p>
      {canManage ? (
        <button
          type="button"
          onClick={onInvite}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {t("cta")}
        </button>
      ) : null}
    </div>
  );
}
