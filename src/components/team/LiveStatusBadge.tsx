"use client";

import { useTranslations } from "next-intl";
import type { TeamLiveStatus } from "@/lib/team/types";

const STATUS_STYLES: Record<
  TeamLiveStatus,
  { dot: string; pulse: boolean; text: string; bg: string }
> = {
  available: {
    dot: "bg-accent-success",
    pulse: true,
    text: "text-accent-success",
    bg: "bg-accent-success/10",
  },
  in_session: {
    dot: "bg-status-checkedIn",
    pulse: true,
    text: "text-status-checkedIn",
    bg: "bg-status-checkedIn/10",
  },
  busy: {
    dot: "bg-accent-warning",
    pulse: false,
    text: "text-accent-warning",
    bg: "bg-accent-warning/10",
  },
  break: {
    dot: "bg-accent",
    pulse: false,
    text: "text-accent",
    bg: "bg-accent/10",
  },
  offline: {
    dot: "bg-muted",
    pulse: false,
    text: "text-muted",
    bg: "bg-elevated",
  },
  on_leave: {
    dot: "bg-muted",
    pulse: false,
    text: "text-muted",
    bg: "bg-subtle/40",
  },
};

interface LiveStatusBadgeProps {
  status: TeamLiveStatus;
  compact?: boolean;
}

export function LiveStatusBadge({ status, compact = false }: LiveStatusBadgeProps) {
  const t = useTranslations("teamOps.status");
  const style = STATUS_STYLES[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        style.bg,
        style.text,
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      ].join(" ")}
    >
      <span className="relative flex h-2 w-2">
        {style.pulse ? (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 motion-reduce:animate-none ${style.dot}`}
            aria-hidden
          />
        ) : null}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
      </span>
      {t(status)}
    </span>
  );
}
