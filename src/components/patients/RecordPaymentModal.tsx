"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { recordPatientPayment } from "@/actions/patientPayments";
import type { Locale } from "@/i18n/routing";

interface RecordPaymentFormValues {
  amount: string;
}

interface RecordPaymentModalProps {
  open: boolean;
  patientId: string;
  balanceDue: number;
  onClose: () => void;
  onRecorded: (newBalance: number) => void;
}

export function RecordPaymentModal({
  open,
  patientId,
  balanceDue,
  onClose,
  onRecorded,
}: RecordPaymentModalProps) {
  const t = useTranslations("financial");
  const locale = useLocale() as Locale;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecordPaymentFormValues>({
    defaultValues: { amount: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ amount: "" });
    }
  }, [open, reset]);

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async function onSubmit(values: RecordPaymentFormValues) {
    const amount = Math.floor(Number(values.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("amount", { message: t("amountInvalid") });
      return;
    }
    if (amount > balanceDue) {
      setError("amount", { message: t("amountExceeds") });
      return;
    }

    const result = await recordPatientPayment(patientId, amount);
    if (!result.success) {
      setError("amount", {
        message: result.error ?? t("paymentFailed"),
      });
      return;
    }

    onRecorded(result.newBalanceDue ?? balanceDue - amount);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-payment-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className={[
              "fixed inset-x-4 top-[20%] z-50 mx-auto max-w-md rounded-2xl",
              "border border-subtle bg-surface p-5 shadow-xl ",
            ].join(" ")}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="text-start">
                <h2
                  id="record-payment-title"
                  className="text-lg font-semibold text-primary"
                >
                  {t("recordPayment")}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {t("currentBalance", { amount: formatMoney(balanceDue) })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 text-start"
            >
              <div>
                <label
                  htmlFor="payment-amount"
                  className="mb-1.5 block text-sm font-medium text-primary"
                >
                  {t("amountLabel")}
                </label>
                <input
                  id="payment-amount"
                  type="number"
                  min={1}
                  max={balanceDue}
                  step={1}
                  inputMode="numeric"
                  placeholder={t("amountPlaceholder")}
                  className={[
                    "w-full rounded-xl border bg-base/40 px-4 py-2.5 text-sm text-primary",
                    "placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
                    errors.amount ? "border-accent-danger" : "border-subtle",
                  ].join(" ")}
                  {...register("amount", { required: t("amountRequired") })}
                />
                {errors.amount && (
                  <p className="mt-1.5 text-xs text-accent-danger">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-subtle px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-elevated"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || balanceDue <= 0}
                  className={[
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                    "bg-accent text-sm font-medium text-white transition hover:bg-accent/90",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  ].join(" ")}
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {t("submitPayment")}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
