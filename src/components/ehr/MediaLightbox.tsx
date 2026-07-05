"use client";

import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { PatientMediaWithUrl } from "@/lib/media/types";

interface MediaLightboxProps {
  item: PatientMediaWithUrl | null;
  onClose: () => void;
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function MediaLightbox({ item, onClose }: MediaLightboxProps) {
  const t = useTranslations("ehr");
  const locale = useLocale() as Locale;

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.button
            type="button"
            aria-label={t("closeLightbox")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-[6%] z-[70] mx-auto flex max-h-[88vh] max-w-4xl flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-2xl sm:inset-x-8"
          >
            <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
              <div className="text-start">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                  {t(`tags.${item.tag}`)}
                </span>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(item.createdAt, locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-primary"
                aria-label={t("closeLightbox")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto">
              <div className="flex min-h-[240px] flex-1 items-center justify-center bg-base p-4">
                {item.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.signedUrl}
                    alt={t(`tags.${item.tag}`)}
                    className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted">{t("imageUnavailable")}</p>
                )}
              </div>

              {item.notes && (
                <div className="border-t border-subtle px-5 py-4 text-start">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                    {t("notes")}
                  </p>
                  <p className="text-sm leading-relaxed text-primary">{item.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
