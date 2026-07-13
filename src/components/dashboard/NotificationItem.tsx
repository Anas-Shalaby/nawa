"use client";

import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarPlus,
  Clock3,
  Package,
  Wallet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AppNotification, NotificationKind } from "@/lib/notifications/types";
import { useNotifications } from "@/components/providers/NotificationsContext";

function kindAccent(kind: NotificationKind, urgent?: boolean): string {
  if (urgent || kind === "urgent") return "bg-accent-danger";
  if (kind === "financial") return "bg-accent-success";
  if (kind === "inventory") return "bg-accent-warning";
  if (kind === "booking") return "bg-accent";
  return "bg-accent/60";
}

function kindIconWrap(kind: NotificationKind, urgent?: boolean): string {
  if (urgent || kind === "urgent") return "bg-accent-danger/15 text-accent-danger";
  if (kind === "financial") return "bg-accent-success/15 text-accent-success";
  if (kind === "inventory") return "bg-accent-warning/15 text-accent-warning";
  if (kind === "booking") return "bg-accent/15 text-accent";
  return "bg-elevated text-muted";
}

function KindIcon({ kind, urgent }: { kind: NotificationKind; urgent?: boolean }) {
  const className = "h-4 w-4";
  if (urgent || kind === "urgent") return <AlertTriangle className={className} aria-hidden />;
  if (kind === "financial") return <Wallet className={className} aria-hidden />;
  if (kind === "inventory") return <Package className={className} aria-hidden />;
  if (kind === "booking") return <CalendarPlus className={className} aria-hidden />;
  return <Clock3 className={className} aria-hidden />;
}

function formatRelativeTime(
  createdAt: number,
  t: (key: string, values?: Record<string, number>) => string,
): string {
  const diffMs = Date.now() - createdAt;
  const mins = Math.max(0, Math.floor(diffMs / 60_000));
  if (mins < 1) return t("timeJustNow");
  if (mins < 60) return t("timeMinsAgo", { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("timeHoursAgo", { hours });
  const days = Math.floor(hours / 24);
  return t("timeDaysAgo", { days });
}

interface NotificationItemProps {
  notification: AppNotification;
  onActivate?: () => void;
}

export function NotificationItem({ notification, onActivate }: NotificationItemProps) {
  const t = useTranslations("dashboard.notifications");
  const { markRead } = useNotifications();

  const actionLabel = notification.actionLabelKey
    ? t(`actions.${notification.actionLabelKey}`)
    : null;

  return (
    <li
      className={[
        "relative flex items-start gap-3 border-b border-subtle p-4 transition-colors",
        "hover:bg-elevated",
        notification.read ? "bg-surface" : "bg-base",
      ].join(" ")}
    >
      <span
        className={[
          "absolute inset-y-0 start-0 w-[3px]",
          kindAccent(notification.kind, notification.urgent),
        ].join(" ")}
        aria-hidden
      />

      <div
        className={[
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          kindIconWrap(notification.kind, notification.urgent),
        ].join(" ")}
      >
        <KindIcon kind={notification.kind} urgent={notification.urgent} />
      </div>

      <div className="min-w-0 flex-1 text-start">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-primary">{notification.title}</p>
          {!notification.read ? (
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-label={t("unreadBadge")}
            />
          ) : null}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{notification.body}</p>
        <p className="mt-1.5 text-[10px] text-muted/80">
          {formatRelativeTime(notification.createdAt, t)}
        </p>

        {actionLabel && notification.actionHref ? (
          <Link
            href={notification.actionHref}
            onClick={() => {
              markRead(notification.id);
              onActivate?.();
            }}
            className="mt-2.5 inline-flex rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent transition hover:bg-accent/20"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
