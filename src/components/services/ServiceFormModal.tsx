"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { addService, updateService } from "@/actions/manageServices";
import { DURATION_OPTIONS } from "@/lib/services/mapService";

export interface ServiceFormValues {
  name: string;
  durationMinutes: number;
  priceEgp: number | null;
  preVisitInstructions: string | null;
}

interface ServiceFormModalProps {
  open: boolean;
  title: string;
  serviceId?: string;
  initialValues?: ServiceFormValues;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: ServiceFormValues = {
  name: "",
  durationMinutes: 30,
  priceEgp: null,
  preVisitInstructions: null,
};

export function ServiceFormModal({
  open,
  title,
  serviceId,
  initialValues,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
  const t = useTranslations("services.form");
  const [form, setForm] = useState<ServiceFormValues>(initialValues ?? EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(initialValues ?? EMPTY_FORM);
      setError(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, initialValues]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const priceRaw = form.priceEgp;
    const payload = {
      name: form.name,
      durationMinutes: form.durationMinutes,
      priceEgp: priceRaw === null || Number.isNaN(priceRaw) ? null : priceRaw,
      preVisitInstructions: form.preVisitInstructions?.trim() || null,
    };

    startTransition(async () => {
      const result = serviceId
        ? await updateService(serviceId, payload)
        : await addService(payload);

      if (!result.success) {
        setError(result.error ?? t("error"));
        return;
      }

      onSaved();
    });
  }

  return (
    <AnimatePresence>
      {open && (
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
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-lg rounded-2xl border border-subtle bg-elevated p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="service-name" className="mb-1.5 block text-sm text-muted">
                  {t("name")}
                </label>
                <input
                  id="service-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  placeholder={t("namePlaceholder")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="service-duration" className="mb-1.5 block text-sm text-muted">
                    {t("duration")}
                  </label>
                  <select
                    id="service-duration"
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        durationMinutes: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  >
                    {DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {t("durationOption", { minutes })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="service-price" className="mb-1.5 block text-sm text-muted">
                    {t("price")}
                  </label>
                  <input
                    id="service-price"
                    type="number"
                    min={0}
                    value={form.priceEgp ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        priceEgp: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                    placeholder={t("pricePlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="service-instructions" className="mb-1.5 block text-sm text-muted">
                  {t("instructions")}
                </label>
                <textarea
                  id="service-instructions"
                  rows={4}
                  value={form.preVisitInstructions ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      preVisitInstructions: event.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  placeholder={t("instructionsPlaceholder")}
                />
              </div>

              {error && (
                <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPending || form.name.trim().length < 2}
                  className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("saving")}
                    </span>
                  ) : (
                    t("save")
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
