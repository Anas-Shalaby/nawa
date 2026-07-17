"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, Phone, Printer, Siren, UserPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { callNextPatient } from "@/actions/missionControl";
import { toast } from "sonner";

interface OperationsCommandListProps {
  pendingTomorrowCount: number;
  unpaidCount: number;
  unreadCount: number;
  canViewRevenue: boolean;
  canManageQueue: boolean;
  onWalkInClick: () => void;
  onCallNextSuccess?: () => void;
}

export function OperationsCommandList({
  pendingTomorrowCount,
  unpaidCount,
  unreadCount,
  canViewRevenue,
  canManageQueue,
  onWalkInClick,
  onCallNextSuccess,
}: OperationsCommandListProps) {
  const t = useTranslations("dashboard.commandCenter.ops");
  const [pending, startTransition] = useTransition();

  function onCallNext() {
    if (!canManageQueue) return;
    startTransition(async () => {
      const result = await callNextPatient();
      if (!result.success) {
        toast.error(result.error ?? t("callNextError"));
        return;
      }
      toast.success(t("callNextSuccess"));
      onCallNextSuccess?.();
    });
  }

  const commands = [
    {
      id: "walk-in",
      label: t("cmdWalkIn"),
      icon: UserPlus,
      onClick: onWalkInClick,
      badge: 0,
      disabled: !canManageQueue,
    },
    {
      id: "call-next",
      label: t("cmdCallNext"),
      icon: Phone,
      onClick: onCallNext,
      badge: 0,
      disabled: !canManageQueue || pending,
    },
    {
      id: "print",
      label: t("cmdPrint"),
      icon: Printer,
      onClick: () => window.print(),
      badge: 0,
      disabled: false,
    },
    {
      id: "emergency",
      label: t("cmdEmergency"),
      icon: Siren,
      onClick: () => toast.message(t("cmdEmergencyHint")),
      badge: 0,
      disabled: !canManageQueue,
    },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold text-primary">{t("commandsTitle")}</h3>
      <div className="grid grid-cols-2 gap-2">
        {commands.map((command) => {
          const Icon = command.icon;
          return (
            <button
              key={command.id}
              type="button"
              disabled={command.disabled}
              onClick={command.onClick}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-subtle bg-surface px-2 py-2 text-[10px] font-semibold text-primary transition hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {command.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5 pt-1">
        {canViewRevenue && unpaidCount > 0 ? (
          <Link
            href="/dashboard/patients"
            className="flex items-center justify-between rounded-lg border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-2 text-[11px] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-danger/30"
          >
            <span>{t("badgePayments")}</span>
            <span className="rounded-full bg-accent-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unpaidCount}
            </span>
          </Link>
        ) : null}
        {pendingTomorrowCount > 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px] text-primary">
            <span>{t("badgeTomorrow")}</span>
            <span className="rounded-full bg-accent-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-warning">
              {pendingTomorrowCount}
            </span>
          </div>
        ) : null}
        {unreadCount > 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px] text-primary">
            <span className="inline-flex items-center gap-1">
              <Bell className="h-3 w-3" aria-hidden />
              {t("badgeNotifications")}
            </span>
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
