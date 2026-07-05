"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { bookAppointment } from "@/actions/bookAppointment";
import { getAvailableSlots } from "@/actions/getAvailableSlots";
import type { PatientBookingFormValues } from "@/lib/booking/schema";
import type { BookingStep, Service, Tenant, TimeSlot } from "@/lib/booking/types";
import { ClinicHero } from "./ClinicHero";
import { ServiceSelector } from "./ServiceSelector";
import { SlotPicker } from "./SlotPicker";
import { PatientForm } from "./PatientForm";

interface BookingFlowProps {
  tenant: Tenant;
  services: Service[];
  initialSlots: TimeSlot[];
}

export function BookingFlow({ tenant, services, initialSlots }: BookingFlowProps) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const initialService = services.length === 1 ? services[0] : null;
  const [step, setStep] = useState<BookingStep>(
    initialService ? "slots" : "services",
  );
  const [selectedService, setSelectedService] = useState<Service | null>(initialService);
  const [slots, setSlots] = useState<TimeSlot[]>(initialService ? initialSlots : []);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSoftBanned, setIsSoftBanned] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingSlots, startSlotsTransition] = useTransition();

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setSelectedSlot(null);
    setSlotError(null);

    startSlotsTransition(async () => {
      const nextSlots = await getAvailableSlots(
        tenant.slug,
        tenant.id,
        service.id,
        locale,
      );
      setSlots(nextSlots);
      setStep("slots");
    });
  }

  function handleSlotSelect(slot: TimeSlot) {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setIsSoftBanned(false);
    setSlotError(null);
  }

  function handleContinueToDetails() {
    if (!selectedSlot || !selectedService) return;
    setStep("details");
  }

  function handleBackToSlots() {
    setStep("slots");
    setIsSoftBanned(false);
    setSlotError(null);
  }

  function handleBackToServices() {
    if (services.length <= 1) return;
    setStep("services");
    setSelectedSlot(null);
    setSlotError(null);
  }

  function handleSubmit(values: PatientBookingFormValues) {
    if (!selectedSlot || !selectedService || isSoftBanned) return;

    setSlotError(null);

    startTransition(async () => {
      const result = await bookAppointment({
        tenantSlug: tenant.slug,
        serviceId: selectedService.id,
        slotTime: selectedSlot.time,
        name: values.name,
        whatsapp: values.whatsapp,
      });

      if (result.errorCode === "SOFT_BANNED") {
        setIsSoftBanned(true);
        return;
      }

      if (result.errorCode === "SLOT_TAKEN") {
        setSlotError(t("slotTaken"));
        return;
      }

      if (!result.success || !result.ticketToken) {
        setSlotError(t("genericError"));
        return;
      }

      router.replace(
        `/${tenant.slug}/success?t=${encodeURIComponent(result.ticketToken)}`,
      );
    });
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col pb-safe">
      <AnimatePresence mode="wait">
        <motion.div
          key="flow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ClinicHero tenant={tenant} />

          {step === "services" && (
            <>
              <ServiceSelector
                services={services}
                selectedServiceId={selectedService?.id ?? null}
                onSelect={handleServiceSelect}
              />
              {isLoadingSlots && (
                <p className="px-5 pb-4 text-sm text-booking-muted">{t("loadingSlots")}</p>
              )}
            </>
          )}

          {step === "slots" && selectedService && (
            <>
              <div className="px-5 pb-3">
                <button
                  type="button"
                  onClick={handleBackToServices}
                  className={[
                    "text-sm text-booking-muted transition hover:text-booking-text",
                    services.length <= 1 ? "invisible" : "",
                  ].join(" ")}
                >
                  {t("changeService")}
                </button>
                <p className="mt-1 text-sm font-medium text-booking-text">
                  {selectedService.name}
                </p>
              </div>

              <SlotPicker
                slots={slots}
                selectedSlotId={selectedSlot?.id ?? null}
                onSelect={handleSlotSelect}
              />

              <div className="sticky bottom-0 mt-auto border-t border-gray-100 bg-booking-bg/95 px-5 py-4 backdrop-blur-sm">
                <button
                  type="button"
                  disabled={!selectedSlot || isLoadingSlots}
                  onClick={handleContinueToDetails}
                  className={[
                    "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl",
                    "text-base font-semibold transition active:scale-[0.98]",
                    selectedSlot
                      ? "bg-booking-accent text-white shadow-lg shadow-booking-accent/20 hover:brightness-105"
                      : "cursor-not-allowed bg-gray-200 text-gray-400",
                  ].join(" ")}
                >
                  {t("continue")}
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
                </button>
              </div>
            </>
          )}

          {step === "details" && selectedSlot && selectedService && (
            <PatientForm
              selectedTimeLabel={selectedSlot.label}
              clinicName={tenant.name}
              clinicWhatsApp={tenant.whatsappNumber}
              isSoftBanned={isSoftBanned}
              isSubmitting={isPending}
              slotError={slotError}
              onBack={handleBackToSlots}
              onSubmit={handleSubmit}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
