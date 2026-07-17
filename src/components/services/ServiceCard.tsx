"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Clock, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import type { Service } from "@/lib/booking/types";

interface ServiceCardProps {
  service: Service;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({ service, deleting, onEdit, onDelete }: ServiceCardProps) {
  const t = useTranslations("services");

  const priceLabel =
    service.priceEgp === null ? t("price", { amount: "—" }) : t("price", { amount: service.priceEgp.toLocaleString() });

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl border border-subtle bg-surface p-5 text-start transition-all hover:border-accent/50 hover:shadow-lg"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: service.colorCode ?? "#64748B" }}
        aria-hidden
      />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-primary">{service.name}</h2>
        </div>
        <span className="shrink-0 rounded-lg bg-accent-success/10 px-3 py-1 text-sm font-bold text-accent-success">
          {priceLabel}
        </span>
      </div>

      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Clock className="h-4 w-4" aria-hidden />
          {t("duration", { minutes: service.durationMinutes })}
        </span>

        {service.isPackage ? (
          <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2.5 text-sm font-bold text-accent">
            <Package className="h-4 w-4" aria-hidden />
            {t("packageBadge", { count: service.sessionsCount })}
          </div>
        ) : null}
      </div>

      {service.preVisitInstructions ? (
        <div className="mt-4 rounded-xl border border-subtle bg-base/40 px-3 py-2.5">
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{service.preVisitInstructions}</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center gap-2 border-t border-subtle pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-elevated hover:text-primary"
            aria-label={t("edit")}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            {t("edit")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-accent-danger/10 hover:text-accent-danger disabled:opacity-50"
            aria-label={t("delete")}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden />
            )}
            {t("delete")}
          </button>
      </div>
    </motion.article>
  );
}
