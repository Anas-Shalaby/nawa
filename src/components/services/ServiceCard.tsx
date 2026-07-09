"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CircleEllipsis, Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import type { Service } from "@/lib/booking/types";

interface ServiceCardProps {
  service: Service;
  category: string;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({ service, category, deleting, onEdit, onDelete }: ServiceCardProps) {
  const t = useTranslations("services");

  const priceLabel =
    service.priceEgp === null ? t("price", { amount: "—" }) : t("price", { amount: service.priceEgp.toLocaleString() });

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-subtle bg-surface p-5 text-start transition-all hover:border-accent/50"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted">{category}</p>
          <h2 className="truncate text-base font-bold text-primary">{service.name}</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-subtle bg-base/30 p-1 text-muted transition group-hover:text-accent">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1.5 transition hover:bg-elevated hover:text-primary"
            aria-label={t("edit")}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-md p-1.5 transition hover:bg-accent-danger/10 hover:text-accent-danger disabled:opacity-50"
            aria-label={t("delete")}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
          </button>
       
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Clock className="h-4 w-4" aria-hidden />
          {t("duration", { minutes: service.durationMinutes })}
        </span>
        <span className="rounded-lg bg-accent/10 px-3 py-1 text-sm font-bold text-accent">
          {priceLabel}
        </span>
      </div>

      {service.preVisitInstructions ? (
        <div className="mt-4 rounded-xl border border-subtle bg-base/40 px-3 py-2.5">
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{service.preVisitInstructions}</p>
        </div>
      ) : null}
    </motion.article>
  );
}
