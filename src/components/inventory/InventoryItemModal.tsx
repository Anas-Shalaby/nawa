"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { upsertInventoryItem } from "@/actions/manageInventory";
import {
  INVENTORY_CATEGORY_OPTIONS,
  type InventoryItem,
} from "@/lib/inventory/types";

export type InventoryFormValues = {
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unitCostEgp: number;
};

interface InventoryItemModalProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: (item: InventoryItem) => void;
}

const EMPTY: InventoryFormValues = {
  name: "",
  category: INVENTORY_CATEGORY_OPTIONS[0],
  quantity: 0,
  minThreshold: 5,
  unitCostEgp: 0,
};

export function InventoryItemModal({
  open,
  item,
  onClose,
  onSaved,
}: InventoryItemModalProps) {
  const t = useTranslations("inventory");
  const [form, setForm] = useState<InventoryFormValues>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(
        item
          ? {
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              minThreshold: item.minThreshold,
              unitCostEgp: item.unitCostEgp,
            }
          : EMPTY,
      );
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, item]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await upsertInventoryItem(form, item?.id);
      if (!result.success || !result.item) {
        setError(result.error ?? t("saveError"));
        return;
      }
      onSaved(result.item);
    });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-t-3xl border border-subtle bg-elevated p-6 shadow-2xl sm:rounded-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="text-start">
                <h2 className="text-lg font-semibold text-primary">
                  {item ? t("editTitle") : t("addTitle")}
                </h2>
                <p className="mt-1 text-xs text-muted">{t("formHint")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-start">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  {t("fields.name")}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder={t("fields.namePlaceholder")}
                  className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-primary">
                  {t("fields.category")}
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                >
                  {INVENTORY_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary">
                    {t("fields.quantity")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary">
                    {t("fields.minThreshold")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minThreshold}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minThreshold: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary">
                    {t("fields.unitCost")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.unitCostEgp}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unitCostEgp: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/10 px-3 py-2 text-sm text-accent-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending || form.name.trim().length < 2}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
