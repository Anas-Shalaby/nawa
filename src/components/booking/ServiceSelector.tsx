"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check, Clock, FileText, Tag } from "lucide-react";
import type { Service } from "@/lib/booking/types";

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
}: ServiceSelectorProps) {
  const t = useTranslations("booking");

  return (
    <section className="px-5 pb-4">
      <h2 className="mb-1 text-lg font-semibold text-booking-text">{t("chooseService")}</h2>
      <p className="mb-4 text-sm text-booking-muted">{t("chooseServiceHint")}</p>

      <div className="grid gap-3">
        {services.map((service, index) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <motion.button
              key={service.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(service)}
              className={[
                "w-full rounded-2xl border px-4 py-4 text-start transition",
                isSelected
                  ? "border-booking-accent bg-booking-accent-light shadow-sm ring-2 ring-booking-accent/20"
                  : "border-gray-100 bg-booking-surface hover:border-booking-accent/30",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-booking-text">{service.name}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-booking-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t("serviceDuration", { minutes: service.durationMinutes })}
                    </span>
                    {service.priceEgp !== null && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-booking-accent">
                        <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {t("servicePrice", { amount: service.priceEgp.toLocaleString() })}
                      </span>
                    )}
                  </div>

                  {service.preVisitInstructions && (
                    <div className="mt-3 rounded-xl border border-gray-100 bg-white/80 px-3 py-2.5">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-booking-muted">
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t("preVisitNote")}
                      </p>
                      <p className="text-sm leading-relaxed text-booking-text">
                        {service.preVisitInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-booking-accent text-white"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                  </motion.span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
