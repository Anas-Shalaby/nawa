"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Clock, FileText, Tag } from "lucide-react";
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
    <section className="px-5 pb-6 text-start" dir="rtl">
      <h2 className="mb-1 text-lg font-semibold text-booking-text">
        1. {t("chooseService")}
      </h2>
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
              transition={{ delay: index * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(service)}
              className={[
                "w-full rounded-2xl border p-4 text-start shadow-sm transition-all",
                isSelected
                  ? "border-booking-accent bg-booking-accent-light"
                  : "border-transparent bg-booking-surface hover:border-booking-accent",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 pe-0 transition",
                    isSelected
                      ? "border-booking-accent bg-booking-accent"
                      : "border-gray-300 bg-white",
                  ].join(" ")}
                  aria-hidden
                >
                  {isSelected ? (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ) : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-booking-text">{service.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-booking-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t("serviceDuration", { minutes: service.durationMinutes })}
                    </span>
                    {service.priceEgp !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {t("servicePrice", {
                          amount: service.priceEgp.toLocaleString(),
                        })}
                      </span>
                    ) : null}
                  </div>

                  {service.preVisitInstructions ? (
                    <div className="mt-3 rounded-xl border border-gray-100 bg-white/80 px-3 py-2">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-booking-muted">
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {t("preVisitNote")}
                      </p>
                      <p className="text-sm leading-relaxed text-booking-text">
                        {service.preVisitInstructions}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
