"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AttentionItem } from "@/lib/dashboard/types";

interface AttentionCenterProps {
  items: AttentionItem[];
  compact?: boolean;
}

export function AttentionCenter({ items, compact = false }: AttentionCenterProps) {
  const t = useTranslations("dashboard.commandCenter.attention");

  if (items.length === 0) return null;

  return (
    <ul className="space-y-1.5" aria-live="polite">
      {items.map((item) => {
        const tone =
          item.severity >= 4
            ? "border-accent-danger/40 bg-accent-danger/10"
            : item.severity >= 3
              ? "border-accent-warning/40 bg-accent-warning/10"
              : "border-subtle bg-surface";

        const body = (
          <div className={["rounded-lg border px-2.5 py-2 text-[11px] text-primary", tone].join(" ")}>
            <p className="font-semibold">{item.title}</p>
            {item.detail ? <p className="text-muted">{item.detail}</p> : null}
            <p className="text-[10px] text-muted">{t(`types.${item.type}`)}</p>
          </div>
        );

        if (item.patientId) {
          return (
            <li key={item.id}>
              <Link
                href={`/dashboard/patients/${item.patientId}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {body}
              </Link>
            </li>
          );
        }

        return <li key={item.id}>{body}</li>;
      })}
      {!compact && items.length === 0 ? (
        <li className="text-center text-[11px] text-muted">{t("empty")}</li>
      ) : null}
    </ul>
  );
}
