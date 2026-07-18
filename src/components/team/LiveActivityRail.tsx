"use client";

import { useLocale, useTranslations } from "next-intl";
import type { TeamActivityEvent } from "@/lib/team/types";
import type { Locale } from "@/i18n/routing";

interface LiveActivityRailProps {
  events: TeamActivityEvent[];
}

function formatRelative(iso: string, locale: Locale): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60_000));
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "auto" });
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

export function LiveActivityRail({ events }: LiveActivityRailProps) {
  const t = useTranslations("teamOps.activity");
  const locale = useLocale() as Locale;

  return (
    <aside className="flex h-full min-h-[280px] flex-col rounded-2xl border border-subtle bg-surface/60 p-4">
      <div className="mb-4 text-start">
        <h2 className="text-sm font-semibold text-primary">{t("title")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("subtitle")}</p>
      </div>

      {events.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-xs text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto pe-1" aria-live="polite">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-subtle/70 bg-elevated/40 px-3 py-2.5 text-start"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium leading-snug text-primary">
                  {t(`verbs.${event.verb}`, {
                    actor: event.actorName,
                    subject: event.subjectName ?? "",
                    detail: event.detail ?? "",
                  })}
                </p>
                <time className="shrink-0 text-[10px] text-muted" dateTime={event.at}>
                  {formatRelative(event.at, locale)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
