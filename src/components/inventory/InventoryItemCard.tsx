"use client";

import { motion } from "framer-motion";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { InventoryItem } from "@/lib/inventory/types";
import {
  getInventoryStockPercent,
  getInventoryStockStatus,
} from "@/lib/inventory/types";
import type { Locale } from "@/i18n/routing";

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit?: () => void;
  onRestock?: () => void;
}

export function InventoryItemCard({
  item,
  onEdit,
  onRestock,
}: InventoryItemCardProps) {
  const t = useTranslations("inventory");
  const locale = useLocale() as Locale;
  const status = getInventoryStockStatus(item.quantity, item.minThreshold);
  const percent = getInventoryStockPercent(item.quantity, item.minThreshold);

  const barClass =
    status === "out"
      ? "bg-accent-danger"
      : status === "low"
        ? "bg-accent-warning"
        : "bg-status-completed";

  return (
    <motion.article
      layout
      className="relative rounded-2xl border border-subtle bg-surface p-5 text-start"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-primary">{item.name}</h3>
          <span className="mt-2 inline-flex rounded-full border border-subtle bg-base/50 px-2.5 py-1 text-[11px] font-medium text-muted">
            {item.category}
          </span>
        </div>

        {status === "low" ? (
          <span className="shrink-0 animate-pulse rounded-full border border-accent-warning/30 bg-accent-warning/10 px-2.5 py-1 text-[11px] font-semibold text-accent-warning">
            {t("badgeLow")}
          </span>
        ) : null}
        {status === "out" ? (
          <span className="shrink-0 rounded-full border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-1 text-[11px] font-semibold text-accent-danger">
            {t("badgeOut")}
          </span>
        ) : null}
      </div>

      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-base">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={["h-full rounded-full", barClass].join(" ")}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {t("stockLabel", {
            qty: item.quantity,
            min: item.minThreshold,
          })}
        </span>
        <span className="tabular-nums">
          {t("unitCost", {
            amount: new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
              maximumFractionDigits: 0,
            }).format(item.unitCostEgp),
          })}
        </span>
      </div>

      {(onRestock || onEdit) && (
        <div className="flex gap-2">
          {onRestock ? (
            <button
              type="button"
              onClick={onRestock}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-subtle bg-base/40 px-3 py-2.5 text-xs font-medium text-primary transition hover:border-accent/40 hover:bg-accent/10"
            >
              <Plus className="h-3.5 w-3.5 text-accent" aria-hidden />
              {t("restock")}
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-subtle px-3 py-2.5 text-xs font-medium text-muted transition hover:bg-elevated hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t("edit")}
            </button>
          ) : null}
        </div>
      )}
    </motion.article>
  );
}
