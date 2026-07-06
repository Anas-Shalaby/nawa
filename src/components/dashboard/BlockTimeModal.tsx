"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createTimeBlock } from "@/actions/timeBlocks";
import { getCairoTodayKey } from "@/lib/datetime/cairo";

interface BlockTimeModalProps {
  tenantId: string;
  /** Compact icon-only trigger for the topbar. */
  compact?: boolean;
}

export function BlockTimeModal({
  tenantId,
  compact = false,
}: BlockTimeModalProps) {
  const t = useTranslations("dashboard.blockTime");
  const [open, setOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(getCairoTodayKey());
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  function resetForm() {
    setBlockDate(getCairoTodayKey());
    setStartTime("12:00");
    setEndTime("13:00");
    setReason("");
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      date: blockDate,
      start: startTime,
      end: endTime,
      reason: reason.trim() || null,
    };

    closeModal();
    toast.success(t("successToast"), {
      description: payload.reason ?? t("successToastHint"),
    });

    startTransition(async () => {
      const result = await createTimeBlock(
        tenantId,
        payload.date,
        payload.start,
        payload.end,
        payload.reason,
      );

      if (!result.success) {
        toast.error(t("errorToast"), {
          description: result.message ?? t("error"),
        });
      }
    });
  }

  const triggerClass = compact
    ? [
        "inline-flex items-center justify-center rounded-xl border border-amber-500/35",
        "bg-amber-500/10 p-2 text-amber-400 transition hover:bg-amber-500/20",
      ].join(" ")
    : [
        "inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10",
        "px-4 py-2.5 text-sm font-medium text-amber-400 transition",
        "hover:bg-amber-500/20 active:scale-[0.98]",
      ].join(" ");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClass}
        aria-label={t("blockTime")}
      >
        <Ban className="h-4 w-4 shrink-0" aria-hidden />
        {!compact ? t("blockTime") : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(event) => {
              if (event.target === overlayRef.current) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-elevated p-0 text-primary shadow-2xl shadow-amber-950/20"
              role="dialog"
              aria-modal="true"
              aria-labelledby="block-time-title"
            >
              <form onSubmit={handleSubmit} className="p-6 text-start">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      {t("badge")}
                    </div>
                    <h2 id="block-time-title" className="text-lg font-semibold">
                      {t("title")}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-primary"
                    aria-label={t("close")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-muted">
                      {t("dateLabel")}
                    </span>
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(event) => setBlockDate(event.target.value)}
                      required
                      className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-amber-500/30 focus:ring-2"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm text-muted">
                        {t("fromLabel")}
                      </span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(event) => setStartTime(event.target.value)}
                        required
                        className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-amber-500/30 focus:ring-2"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm text-muted">
                        {t("toLabel")}
                      </span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(event) => setEndTime(event.target.value)}
                        required
                        className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-amber-500/30 focus:ring-2"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-sm text-muted">
                      {t("reasonLabel")}
                    </span>
                    <input
                      type="text"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={t("reasonPlaceholder")}
                      className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-amber-500/30 focus:ring-2"
                    />
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        {t("submitting")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
