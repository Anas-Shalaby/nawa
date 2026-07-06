"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteService } from "@/actions/manageServices";
import type { Service } from "@/lib/booking/types";

interface ServiceDeleteModalProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (serviceId: string) => void;
}

export function ServiceDeleteModal({
  service,
  open,
  onClose,
  onDeleted,
}: ServiceDeleteModalProps) {
  const t = useTranslations("services.deleteModal");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleConfirm() {
    if (!service) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteService(service.id);

      if (!result.success) {
        setError(
          result.errorCode === "HAS_APPOINTMENTS"
            ? t("hasAppointments")
            : result.error ?? t("error"),
        );
        return;
      }

      onDeleted(service.id);
      onClose();
    });
  }

  return (
    <AnimatePresence>
      {open && service ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isPending) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-md rounded-2xl border border-subtle bg-elevated p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-service-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 text-start">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-danger/10">
                  <Trash2 className="h-5 w-5 text-accent-danger" aria-hidden />
                </span>
                <div>
                  <h2 id="delete-service-title" className="text-lg font-semibold text-primary">
                    {t("title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{t("subtitle", { name: service.name })}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary disabled:opacity-50"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-start text-sm leading-relaxed text-muted">{t("body")}</p>

            {error ? (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-3 text-start text-sm text-accent-danger">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-accent-danger px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("deleting")}
                  </span>
                ) : (
                  t("confirm")
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
