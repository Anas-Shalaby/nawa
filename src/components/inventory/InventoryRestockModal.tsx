"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PackagePlus, X } from "lucide-react";
import { restockInventoryItem } from "@/actions/manageInventory";
import type { InventoryItem } from "@/lib/inventory/types";

interface InventoryRestockModalProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onRestocked: (item: InventoryItem) => void;
}

export function InventoryRestockModal({
  open,
  item,
  onClose,
  onRestocked,
}: InventoryRestockModalProps) {
  const t = useTranslations("inventory");
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setAmount(10);
      setError(null);
    }
  }, [open, item]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!item) return;
    setError(null);

    startTransition(async () => {
      const result = await restockInventoryItem(item.id, amount);
      if (!result.success || !result.item) {
        setError(result.error ?? t("restockError"));
        return;
      }
      onRestocked(result.item);
    });
  }

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-subtle bg-elevated p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="text-start">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <PackagePlus className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-base font-semibold text-primary">{t("restockTitle")}</h2>
                <p className="mt-1 text-xs text-muted">{item.name}</p>
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
                  {t("fields.restockAmount")}
                </label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                  className="w-full rounded-xl border border-subtle bg-base/40 px-3.5 py-2.5 text-sm text-primary outline-none transition focus:border-accent"
                />
                <p className="mt-1.5 text-xs text-muted">
                  {t("restockPreview", {
                    current: item.quantity,
                    next: item.quantity + Math.max(0, Math.floor(amount) || 0),
                  })}
                </p>
              </div>

              {error ? (
                <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/10 px-3 py-2 text-sm text-accent-danger">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending || amount <= 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("saving")}
                  </>
                ) : (
                  t("confirmRestock")
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
