"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Phone,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createInternalBooking,
  getInternalBookingSlots,
  lookupPatientByPhone,
  type InternalPatientLookup,
} from "@/actions/internalBooking";
import { useRouter } from "@/i18n/navigation";
import { normalizeEgyptPhone } from "@/lib/booking/schema";
import {
  buildCairoAppointmentIso,
  formatCairoWeekday,
  formatSlotLabel,
  getCairoTodayKey,
  getUpcomingCairoDateKeys,
} from "@/lib/datetime/cairo";
import type { DashboardService } from "@/lib/dashboard/types";
import {
  createInternalBookingSchema,
  type InternalBookingFormValues,
  type InternalBookingValidationKey,
} from "@/lib/internalBooking/schema";
import type { Locale } from "@/i18n/routing";
import type { BookingDrawerSelection } from "./GlobalBookingDrawerContext";

const RELATIONSHIPS = ["child", "spouse", "parent", "sibling", "other"] as const;
const NEW_DEPENDENT_VALUE = "__new__";

interface GlobalBookingDrawerProps {
  open: boolean;
  services: DashboardService[];
  initialSelection?: BookingDrawerSelection;
  onClose: () => void;
}

type SlotOption = { time: string; available: boolean };

export function GlobalBookingDrawer({
  open,
  services,
  initialSelection,
  onClose,
}: GlobalBookingDrawerProps) {
  const t = useTranslations("dashboard.internalBooking");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const lookupSequence = useRef(0);
  const slotSequence = useRef(0);
  const dates = useMemo(() => getUpcomingCairoDateKeys(14), []);
  const schema = useMemo(
    () =>
      createInternalBookingSchema((key: InternalBookingValidationKey) =>
        t(`validation.${key}`),
      ),
    [t],
  );

  const [patient, setPatient] = useState<InternalPatientLookup | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InternalBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      patientName: "",
      bookForDependent: false,
      dependentId: "",
      dependentName: "",
      relationshipType: undefined,
      serviceId: initialSelection?.serviceId ?? services[0]?.id ?? "",
      date: initialSelection?.date ?? getCairoTodayKey(),
      slotTime: "",
    },
  });

  const phone = watch("phone");
  const bookForDependent = watch("bookForDependent");
  const dependentId = watch("dependentId");
  const serviceId = watch("serviceId");
  const selectedDate = watch("date");
  const selectedSlot = watch("slotTime");

  useEffect(() => {
    if (!open) return;

    reset({
      phone: "",
      patientName: "",
      bookForDependent: false,
      dependentId: "",
      dependentName: "",
      relationshipType: undefined,
      serviceId: initialSelection?.serviceId ?? services[0]?.id ?? "",
      date: initialSelection?.date ?? getCairoTodayKey(),
      slotTime: "",
    });
    setPatient(null);
    setLookupComplete(false);
    setSlots([]);
    setSubmitError(null);
  }, [
    initialSelection?.date,
    initialSelection?.serviceId,
    open,
    reset,
    services,
  ]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isPending, onClose, open]);

  useEffect(() => {
    if (!open) return;

    const normalized = normalizeEgyptPhone(phone ?? "");
    const sequence = ++lookupSequence.current;
    setPatient(null);
    setLookupComplete(false);
    setValue("dependentId", "");

    if (!/^1[0125]\d{8}$/.test(normalized)) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupPatientByPhone(phone);
        if (sequence !== lookupSequence.current) return;
        setPatient(result);
        setLookupComplete(true);
        if (result) {
          setValue("patientName", result.name, {
            shouldValidate: true,
          });
          if (result.dependents[0]) {
            setValue("dependentId", result.dependents[0].id);
          }
        } else {
          setValue("patientName", "");
        }
      } catch {
        if (sequence === lookupSequence.current) {
          setLookupComplete(true);
        }
      } finally {
        if (sequence === lookupSequence.current) setIsSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [open, phone, setValue]);

  useEffect(() => {
    if (!open || !serviceId || !selectedDate) {
      setSlots([]);
      return;
    }

    const sequence = ++slotSequence.current;
    setIsLoadingSlots(true);
    setValue("slotTime", "");
    const requestedTime =
      initialSelection?.date === selectedDate ? initialSelection.time : undefined;

    void getInternalBookingSlots(serviceId, selectedDate)
      .then((result) => {
        if (sequence !== slotSequence.current) return;
        setSlots(result);
        if (
          requestedTime &&
          result.some(
            (slot) => slot.time === requestedTime && slot.available,
          )
        ) {
          setValue("slotTime", requestedTime, { shouldValidate: true });
        }
      })
      .catch(() => {
        if (sequence === slotSequence.current) setSlots([]);
      })
      .finally(() => {
        if (sequence === slotSequence.current) setIsLoadingSlots(false);
      });
  }, [
    initialSelection?.date,
    initialSelection?.time,
    open,
    selectedDate,
    serviceId,
    setValue,
  ]);

  function selectDate(date: string) {
    setValue("date", date, { shouldValidate: true });
    setSubmitError(null);
  }

  function closeDrawer() {
    if (!isPending) onClose();
  }

  function onSubmit(values: InternalBookingFormValues) {
    setSubmitError(null);

    startTransition(async () => {
      const result = await createInternalBooking({
        phone: values.phone,
        patientName: values.patientName,
        bookForDependent: values.bookForDependent ?? false,
        dependentId:
          values.dependentId && values.dependentId !== NEW_DEPENDENT_VALUE
            ? values.dependentId
            : undefined,
        dependentName: values.dependentName,
        relationshipType: values.relationshipType,
        serviceId: values.serviceId,
        date: values.date,
        slotTime: values.slotTime,
      });

      if (!result.success) {
        const message =
          result.errorCode === "SLOT_TAKEN"
            ? t("slotTaken")
            : result.message ?? t("error");
        setSubmitError(message);
        toast.error(t("error"), { description: message });

        if (result.errorCode === "SLOT_TAKEN") {
          const refreshed = await getInternalBookingSlots(
            values.serviceId,
            values.date,
          );
          setSlots(refreshed);
          setValue("slotTime", "");
        }
        return;
      }

      toast.success(t("success"));
      router.refresh();
      onClose();
    });
  }

  const showNewDependentFields =
    bookForDependent &&
    (!patient ||
      patient.dependents.length === 0 ||
      dependentId === NEW_DEPENDENT_VALUE);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={t("close")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            disabled={isPending}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-booking-title"
            dir="rtl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-lg flex-col border-e border-subtle bg-base shadow-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-subtle bg-surface px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <CalendarDays className="h-5 w-5" aria-hidden />
                </span>
                <h2
                  id="global-booking-title"
                  className="text-lg font-bold text-primary"
                >
                  {t("title")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                disabled={isPending}
                className="rounded-xl p-2 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>

            <form
              id="global-booking-form"
              onSubmit={handleSubmit(onSubmit)}
              className="min-h-0 flex-1 overflow-y-auto"
              noValidate
            >
              <div className="space-y-7 px-5 py-6">
                <FormSection
                  icon={<UserRound className="h-4 w-4" aria-hidden />}
                  title={t("patientSection")}
                >
                  <Field label={t("phoneLabel")} error={errors.phone?.message}>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        {...register("phone")}
                        type="tel"
                        inputMode="tel"
                        autoFocus
                        autoComplete="tel"
                        placeholder={t("phonePlaceholder")}
                        className="w-full rounded-xl border border-subtle bg-surface py-3 pe-4 ps-10 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      {isSearching ? (
                        <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent" />
                      ) : null}
                    </div>
                  </Field>

                  {patient ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-success/25 bg-accent-success/10 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary">
                          {patient.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {patient.phoneNumber}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-success/15 px-2.5 py-1 text-[11px] font-semibold text-accent-success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        {t("registered")}
                      </span>
                    </div>
                  ) : lookupComplete ? (
                    <p className="rounded-xl border border-dashed border-subtle bg-elevated/30 px-3 py-2.5 text-xs text-muted">
                      {t("newPatient")}
                    </p>
                  ) : null}

                  <Field
                    label={t("nameLabel")}
                    error={errors.patientName?.message}
                  >
                    <input
                      {...register("patientName")}
                      type="text"
                      readOnly={Boolean(patient)}
                      placeholder={t("namePlaceholder")}
                      className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none transition placeholder:text-muted read-only:bg-elevated/50 read-only:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </Field>

                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-subtle bg-surface p-3">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <UsersRound className="h-4 w-4 text-accent" aria-hidden />
                      {t("dependentToggle")}
                    </span>
                    <input
                      {...register("bookForDependent")}
                      type="checkbox"
                      className="h-5 w-5 rounded border-subtle accent-accent"
                    />
                  </label>

                  <AnimatePresence initial={false}>
                    {bookForDependent ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {patient && patient.dependents.length > 0 ? (
                          <Field label={t("dependentSelectLabel")}>
                            <select
                              {...register("dependentId")}
                              className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            >
                              {patient.dependents.map((dependent) => (
                                <option key={dependent.id} value={dependent.id}>
                                  {dependent.name}
                                  {dependent.relationshipType
                                    ? ` — ${relationshipLabel(
                                        dependent.relationshipType,
                                        t,
                                      )}`
                                    : ""}
                                </option>
                              ))}
                              <option value={NEW_DEPENDENT_VALUE}>
                                {t("newDependentOption")}
                              </option>
                            </select>
                          </Field>
                        ) : null}

                        {showNewDependentFields ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                              label={t("dependentNameLabel")}
                              error={errors.dependentName?.message}
                            >
                              <input
                                {...register("dependentName")}
                                type="text"
                                placeholder={t("dependentNamePlaceholder")}
                                className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                              />
                            </Field>
                            <Field
                              label={t("relationshipLabel")}
                              error={errors.relationshipType?.message}
                            >
                              <select
                                {...register("relationshipType")}
                                className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                              >
                                <option value="">
                                  {t("relationshipPlaceholder")}
                                </option>
                                {RELATIONSHIPS.map((relationship) => (
                                  <option key={relationship} value={relationship}>
                                    {t(`relationships.${relationship}`)}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                        ) : null}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </FormSection>

                <FormSection
                  icon={<Stethoscope className="h-4 w-4" aria-hidden />}
                  title={t("serviceSection")}
                >
                  <Field
                    label={t("serviceLabel")}
                    error={errors.serviceId?.message}
                  >
                    <select
                      {...register("serviceId")}
                      className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="">{t("servicePlaceholder")}</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormSection>

                <FormSection
                  icon={<Clock3 className="h-4 w-4" aria-hidden />}
                  title={t("dateSection")}
                >
                  <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {dates.map((date) => {
                      const selected = selectedDate === date;
                      const day = new Intl.DateTimeFormat(
                        locale === "ar" ? "ar-EG" : "en-EG",
                        {
                          day: "numeric",
                          month: "short",
                          timeZone: "Africa/Cairo",
                        },
                      ).format(
                        new Date(buildCairoAppointmentIso(date, "12:00")),
                      );

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => selectDate(date)}
                          className={[
                            "min-w-[76px] shrink-0 rounded-xl border px-3 py-2.5 text-center transition",
                            selected
                              ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                              : "border-subtle bg-surface text-muted hover:border-accent/40 hover:text-primary",
                          ].join(" ")}
                        >
                          <span className="block text-[10px] font-medium">
                            {formatCairoWeekday(date, locale)}
                          </span>
                          <span className="mt-1 block text-sm font-bold">
                            {day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {isLoadingSlots ? (
                    <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("loadingSlots")}
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-subtle py-8 text-center text-sm text-muted">
                      {t("noSlots")}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((slot) => {
                          const selected = selectedSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              title={
                                slot.available
                                  ? t("available")
                                  : t("unavailable")
                              }
                              onClick={() => {
                                setValue("slotTime", slot.time, {
                                  shouldValidate: true,
                                });
                                setSubmitError(null);
                              }}
                              className={[
                                "min-h-11 rounded-xl border text-sm font-semibold transition",
                                !slot.available
                                  ? "cursor-not-allowed border-subtle bg-elevated/50 text-muted/40 line-through"
                                  : selected
                                    ? "border-accent bg-accent text-white shadow-md shadow-accent/20"
                                    : "border-subtle bg-surface text-primary hover:border-accent/40 hover:text-accent",
                              ].join(" ")}
                            >
                              {formatSlotLabel(
                                slot.time,
                                locale,
                                selectedDate,
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {errors.slotTime?.message ? (
                        <p className="text-xs text-accent-danger">
                          {errors.slotTime.message}
                        </p>
                      ) : null}
                    </>
                  )}
                </FormSection>

                {submitError ? (
                  <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/10 px-4 py-3 text-sm text-accent-danger">
                    {submitError}
                  </p>
                ) : null}
              </div>
            </form>

            <footer className="sticky bottom-0 z-10 flex shrink-0 gap-2 border-t border-subtle bg-surface/95 px-5 py-4 backdrop-blur-md">
              <button
                type="button"
                onClick={closeDrawer}
                disabled={isPending}
                className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-semibold text-muted transition hover:bg-elevated disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                form="global-booking-form"
                disabled={isPending}
                className="inline-flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                )}
                {isPending ? t("confirming") : t("confirm")}
              </button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function FormSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
        <span className="text-accent">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs text-accent-danger">{error}</span>
      ) : null}
    </label>
  );
}

function relationshipLabel(
  value: string,
  t: (key: string) => string,
): string {
  return RELATIONSHIPS.includes(value as (typeof RELATIONSHIPS)[number])
    ? t(`relationships.${value}`)
    : value;
}
