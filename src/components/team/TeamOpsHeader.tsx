"use client";

import { Search, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TeamLiveStatus, TeamRole } from "@/lib/team/types";

const ROLE_FILTERS: Array<TeamRole | "all"> = [
  "all",
  "doctor",
  "receptionist",
  "nurse",
  "assistant",
  "lab",
  "manager",
];

const STATUS_FILTERS: Array<TeamLiveStatus | "all"> = [
  "all",
  "available",
  "in_session",
  "busy",
  "break",
  "offline",
  "on_leave",
];

interface TeamOpsHeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  role: TeamRole | "all";
  onRoleChange: (value: TeamRole | "all") => void;
  status: TeamLiveStatus | "all";
  onStatusChange: (value: TeamLiveStatus | "all") => void;
  canManage: boolean;
  onInvite: () => void;
}

export function TeamOpsHeader({
  query,
  onQueryChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  canManage,
  onInvite,
}: TeamOpsHeaderProps) {
  const t = useTranslations("teamOps");

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="text-start">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {t("actions.invite")}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{t("filters.search")}</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="w-full rounded-xl border border-subtle bg-surface py-2.5 pe-3 ps-10 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filters.role")}>
        {ROLE_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={role === value}
            onClick={() => onRoleChange(value)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              role === value
                ? "bg-accent text-white"
                : "border border-subtle bg-surface text-muted hover:text-primary",
            ].join(" ")}
          >
            {value === "all" ? t("filters.allRoles") : t(`roles.${value}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("filters.status")}>
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              status === value
                ? "bg-elevated text-primary ring-1 ring-accent/30"
                : "border border-subtle/80 text-muted hover:text-primary",
            ].join(" ")}
          >
            {value === "all" ? t("filters.allStatuses") : t(`status.${value}`)}
          </button>
        ))}
      </div>
    </header>
  );
}
