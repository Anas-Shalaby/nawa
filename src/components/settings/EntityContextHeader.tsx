"use client";

import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface EntityContextHeaderProps {
  entityLabel: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  breadcrumb?: { href: string; label: string };
  action?: React.ReactNode;
}

/**
 * Makes clear which entity is being edited: Clinic, Team, or You.
 */
export function EntityContextHeader({
  entityLabel,
  title,
  subtitle,
  icon: Icon,
  breadcrumb,
  action,
}: EntityContextHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 text-start">
        {breadcrumb ? (
          <Link
            href={breadcrumb.href}
            className="mb-2 inline-block text-sm text-muted transition hover:text-primary"
          >
            {breadcrumb.label}
          </Link>
        ) : null}
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {entityLabel}
        </div>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
