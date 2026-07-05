"use client";

import { useTranslations } from "next-intl";
import { Clock, Loader2, Pencil, Tag, Trash2 } from "lucide-react";
import type { Service } from "@/lib/booking/types";

interface ServiceCardProps {
  service: Service;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({ service, deleting, onEdit, onDelete }: ServiceCardProps) {
  const t = useTranslations("services");

  return (
    <article className="flex h-full flex-col rounded-2xl border border-subtle bg-surface p-5 text-start">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-primary">{service.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t("duration", { minutes: service.durationMinutes })}
            </span>
            {service.priceEgp !== null && (
              <span className="inline-flex items-center gap-1.5 text-accent-success">
                <Tag className="h-3.5 w-3.5" aria-hidden />
                {t("price", { amount: service.priceEgp.toLocaleString() })}
              </span>
            )}
          </div>
        </div>
      </div>

      {service.preVisitInstructions && (
        <div className="mb-4 rounded-xl border border-subtle bg-base px-4 py-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {t("instructionsLabel")}
          </p>
          <p className="text-sm leading-relaxed text-primary">{service.preVisitInstructions}</p>
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:bg-elevated hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {t("edit")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-accent-danger/20 px-3 py-2 text-xs font-medium text-accent-danger transition hover:bg-accent-danger/10 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
          {t("delete")}
        </button>
      </div>
    </article>
  );
}
