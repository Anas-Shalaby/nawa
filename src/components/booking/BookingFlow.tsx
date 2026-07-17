"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { bookAppointment } from "@/actions/bookAppointment";
import { getAvailableSlots } from "@/actions/getAvailableSlots";
import { getCairoTodayKey } from "@/lib/datetime/cairo";
import {
  createPatientBookingSchema,
  type PatientBookingFormValues,
} from "@/lib/booking/schema";
import type { Service, Tenant, TimeSlot } from "@/lib/booking/types";
import type { Locale } from "@/i18n/routing";
import { ClinicHero } from "./ClinicHero";
import { DateSelector } from "./DateSelector";
import { ServiceSelector } from "./ServiceSelector";
import { SlotPicker } from "./SlotPicker";
import { SoftBanCard } from "./SoftBanCard";

interface BookingFlowProps {
  tenant: Tenant;
  services: Service[];
}

export function BookingFlow({ tenant, services }: BookingFlowProps) {
  const t = useTranslations("booking");
  const tv = useTranslations("validation");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const initialService = services.length === 1 ? services[0] : null;
  const [selectedService, setSelectedService] = useState<Service | null>(initialService);
  const [selectedDate, setSelectedDate] = useState(getCairoTodayKey());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSoftBanned, setIsSoftBanned] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingSlots, startSlotsTransition] = useTransition();

  const schema = useMemo(
    () =>
      createPatientBookingSchema((key) =>
        tv(key),
      ),
    [tv],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      whatsapp: "",
      bookingType: "self",
      dependentName: "",
      relationshipType: "",
    },
  });
  const bookingType = watch("bookingType");

  function loadSlots(service: Service, date: string) {
    startSlotsTransition(async () => {
      const nextSlots = await getAvailableSlots(
        tenant.slug,
        tenant.id,
        service.id,
        date,
        locale,
      );
      setSlots(nextSlots);
      setSelectedSlot(null);
    });
  }

  useEffect(() => {
    if (initialService) {
      loadSlots(initialService, selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setSlotError(null);
    setIsSoftBanned(false);
    loadSlots(service, selectedDate);
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSlotError(null);
    if (selectedService) {
      loadSlots(selectedService, date);
    }
  }

  function handleSlotSelect(slot: TimeSlot) {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setIsSoftBanned(false);
    setSlotError(null);
  }

  const canConfirm = Boolean(selectedService && selectedSlot && !isSoftBanned);

  function onConfirm(values: PatientBookingFormValues) {
    if (!selectedSlot || !selectedService || isSoftBanned) return;

    setSlotError(null);

    startTransition(async () => {
      const result = await bookAppointment({
        tenantSlug: tenant.slug,
        serviceId: selectedService.id,
        date: selectedDate,
        slotTime: selectedSlot.time,
        name: values.name,
        whatsapp: values.whatsapp,
        bookingType: values.bookingType ?? "self",
        dependentName: values.dependentName,
        relationshipType: values.relationshipType as
          | "child"
          | "spouse"
          | "parent"
          | "other"
          | undefined,
      });

      if (result.errorCode === "SOFT_BANNED") {
        setIsSoftBanned(true);
        return;
      }

      if (result.errorCode === "SLOT_TAKEN") {
        setSlotError(t("slotTaken"));
        loadSlots(selectedService, selectedDate);
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
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col bg-booking-bg" dir="rtl">
      <ClinicHero tenant={tenant} />

      <form
        id="nawa-booking-form"
        onSubmit={handleSubmit(onConfirm)}
        className="flex flex-1 flex-col pb-36"
        noValidate
      >
        <ServiceSelector
          services={services}
          selectedServiceId={selectedService?.id ?? null}
          onSelect={handleServiceSelect}
        />

        <section className="px-5 pb-6 text-start">
          <h2 className="mb-1 text-lg font-semibold text-booking-text">
            2. {t("chooseAppointment")}
          </h2>
          <p className="mb-4 text-sm text-booking-muted">{t("chooseAppointmentHint")}</p>

          {!selectedService ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-booking-surface px-4 py-8 text-center">
              <p className="text-sm text-booking-muted">{t("selectServiceFirst")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <DateSelector selectedDate={selectedDate} onSelect={handleDateSelect} />
              <SlotPicker
                slots={slots}
                selectedSlotId={selectedSlot?.id ?? null}
                isLoading={isLoadingSlots}
                onSelect={handleSlotSelect}
              />
            </div>
          )}
        </section>

        <section className="px-5 pb-6 text-start">
          <h2 className="mb-1 text-lg font-semibold text-booking-text">
            3. {t("bookingDetails")}
          </h2>
          <p className="mb-4 text-sm text-booking-muted">{t("bookingDetailsHint")}</p>

          {isSoftBanned ? (
            <SoftBanCard clinicName={tenant.name} whatsappNumber={tenant.whatsappNumber} />
          ) : (
            <div className="space-y-4">
              <fieldset dir="rtl">
                <legend className="mb-2 block text-sm font-semibold text-booking-text">
                  {t("bookingForTitle")}
                </legend>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  <label
                    className={[
                      "relative flex min-h-[92px] cursor-pointer flex-col rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-booking-accent/40",
                      bookingType === "self"
                        ? "border-booking-accent bg-booking-accent-light shadow-sm"
                        : "border-gray-200 bg-booking-surface hover:border-booking-accent/40",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      value="self"
                      className="peer sr-only"
                      {...register("bookingType")}
                    />
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-booking-accent/10 text-booking-accent">
                      <UserRound className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-booking-text">
                      {t("bookingForSelf")}
                    </span>
                    <span className="mt-1 text-[11px] leading-4 text-booking-muted">
                      {t("bookingForSelfHint")}
                    </span>
                  </label>

                  <label
                    className={[
                      "relative flex min-h-[92px] cursor-pointer flex-col rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-booking-accent/40",
                      bookingType === "dependent"
                        ? "border-booking-accent bg-booking-accent-light shadow-sm"
                        : "border-gray-200 bg-booking-surface hover:border-booking-accent/40",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      value="dependent"
                      className="peer sr-only"
                      {...register("bookingType")}
                    />
                    <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-booking-accent/10 text-booking-accent">
                      <UsersRound className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-booking-text">
                      {t("bookingForDependent")}
                    </span>
                    <span className="mt-1 text-[11px] leading-4 text-booking-muted">
                      {t("bookingForDependentHint")}
                    </span>
                  </label>
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="booking-name"
                  className="mb-1.5 block text-sm font-medium text-booking-text"
                >
                  {bookingType === "dependent" ? t("responsibleName") : t("fullName")}
                </label>
                <input
                  id="booking-name"
                  type="text"
                  autoComplete="name"
                  placeholder={
                    bookingType === "dependent"
                      ? t("responsibleNamePlaceholder")
                      : t("namePlaceholder")
                  }
                  className={[
                    "w-full rounded-xl border bg-booking-surface px-4 py-3.5 text-base text-booking-text",
                    "placeholder:text-gray-400 focus:border-booking-accent focus:outline-none focus:ring-2 focus:ring-booking-accent/30",
                    errors.name ? "border-red-300" : "border-gray-200",
                  ].join(" ")}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {bookingType === "dependent" ? (
                  <motion.div
                    key="dependent-fields"
                    initial={{ opacity: 0, height: 0, y: -8 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 rounded-2xl border border-booking-accent/20 bg-booking-accent-light/50 p-3">
                      <div className="relative">
                        <input
                          id="booking-dependent-name"
                          type="text"
                          autoComplete="off"
                          placeholder=" "
                          className={[
                            "peer w-full rounded-xl border bg-booking-surface px-4 pb-2 pt-6 text-base text-booking-text",
                            "placeholder:text-transparent focus:border-booking-accent focus:outline-none focus:ring-2 focus:ring-booking-accent/30",
                            errors.dependentName ? "border-red-300" : "border-gray-200",
                          ].join(" ")}
                          {...register("dependentName")}
                        />
                        <label
                          htmlFor="booking-dependent-name"
                          className="pointer-events-none absolute start-4 top-2 text-xs font-medium text-booking-muted transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-booking-accent"
                        >
                          {t("dependentName")}
                        </label>
                        {errors.dependentName ? (
                          <p className="mt-1.5 text-sm text-red-500">
                            {errors.dependentName.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="relative">
                        <select
                          id="booking-relationship"
                          className={[
                            "w-full appearance-none rounded-xl border bg-booking-surface px-4 pb-2 pt-6 text-base text-booking-text",
                            "focus:border-booking-accent focus:outline-none focus:ring-2 focus:ring-booking-accent/30",
                            errors.relationshipType ? "border-red-300" : "border-gray-200",
                          ].join(" ")}
                          {...register("relationshipType")}
                        >
                          <option value="">{t("relationshipPlaceholder")}</option>
                          <option value="child">{t("relationships.child")}</option>
                          <option value="spouse">{t("relationships.spouse")}</option>
                          <option value="parent">{t("relationships.parent")}</option>
                          <option value="other">{t("relationships.other")}</option>
                        </select>
                        <label
                          htmlFor="booking-relationship"
                          className="pointer-events-none absolute start-4 top-2 text-xs font-medium text-booking-muted"
                        >
                          {t("relationshipType")}
                        </label>
                        {errors.relationshipType ? (
                          <p className="mt-1.5 text-sm text-red-500">
                            {errors.relationshipType.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div>
                <label
                  htmlFor="booking-whatsapp"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-booking-text"
                >
                  {t("whatsappNumber")}
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                </label>
                <input
                  id="booking-whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t("whatsappPlaceholder")}
                  className={[
                    "w-full rounded-xl border bg-booking-surface px-4 py-3.5 text-base text-booking-text",
                    "placeholder:text-gray-400 focus:border-booking-accent focus:outline-none focus:ring-2 focus:ring-booking-accent/30",
                    errors.whatsapp ? "border-red-300" : "border-gray-200",
                  ].join(" ")}
                  {...register("whatsapp")}
                />
                {errors.whatsapp ? (
                  <p className="mt-1.5 text-sm text-red-500">{errors.whatsapp.message}</p>
                ) : null}
                <p className="mt-1.5 text-xs text-booking-muted">{t("whatsappHint")}</p>
              </div>

              <div>
                <label
                  htmlFor="booking-notes"
                  className="mb-1.5 block text-sm font-medium text-booking-text"
                >
                  {t("notesOptional")}
                </label>
                <textarea
                  id="booking-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-booking-surface px-4 py-3.5 text-base text-booking-text placeholder:text-gray-400 focus:border-booking-accent focus:outline-none focus:ring-2 focus:ring-booking-accent/30"
                />
              </div>

              {slotError ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {slotError}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <p className="px-5 pb-4 text-center text-xs text-booking-muted">
          {t("poweredByBefore")}{" "}
          <span className="font-bold text-booking-accent">Nawa</span>{" "}
          <span aria-hidden>✦</span>
        </p>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-booking-surface/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <motion.button
            type="submit"
            form="nawa-booking-form"
            disabled={!canConfirm || isPending || isLoadingSlots}
            whileTap={canConfirm && !isPending ? { scale: 0.98 } : undefined}
            className={[
              "w-full rounded-2xl py-4 text-lg font-bold transition",
              canConfirm && !isPending
                ? "bg-booking-accent text-white shadow-lg shadow-booking-accent/30"
                : "cursor-not-allowed bg-gray-200 text-gray-400",
            ].join(" ")}
          >
            {isPending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                {t("bookingProgress")}
              </span>
            ) : (
              t("confirmBooking")
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
