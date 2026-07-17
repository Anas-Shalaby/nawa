"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Package, Palette, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { addService, updateService } from "@/actions/manageServices";
import { DURATION_OPTIONS } from "@/lib/services/mapService";
import {
  createServiceSchema,
  type ServiceFormValues,
  type ServiceValidationKey,
} from "@/lib/services/schema";

export type { ServiceFormValues } from "@/lib/services/schema";

interface ServiceFormModalProps {
  open: boolean;
  title: string;
  serviceId?: string;
  initialValues?: ServiceFormValues;
  onClose: () => void;
  onSaved: (values: ServiceFormValues) => void;
}

const EMPTY_FORM: ServiceFormValues = {
  name: "",
  durationMinutes: 30,
  priceEgp: null,
  preVisitInstructions: null,
  isPackage: false,
  sessionsCount: 1,
  colorCode: "#00CEC9",
};

const COLOR_PRESETS = [
  "#00CEC9",
  "#0984E3",
  "#6C5CE7",
  "#E84393",
  "#FDCB6E",
  "#00B894",
  "#E17055",
];

export function ServiceFormModal({
  open,
  title,
  serviceId,
  initialValues,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
  const t = useTranslations("services.form");
  const schema = useMemo(
    () =>
      createServiceSchema((key: ServiceValidationKey) =>
        t(`validation.${key}`),
      ),
    [t],
  );
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_FORM,
  });
  const isPackage = watch("isPackage");
  const colorCode = watch("colorCode");

  useEffect(() => {
    if (open) {
      reset(initialValues ?? EMPTY_FORM);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [initialValues, open, reset]);

  function onSubmit(values: ServiceFormValues) {
    startTransition(async () => {
      const result = serviceId
        ? await updateService(serviceId, values)
        : await addService(values);

      if (!result.success) {
        setError("root", { message: result.error ?? t("error") });
        return;
      }

      onSaved(values);
    });
  }

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
          onClick={() => !isPending && onClose()}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        />
        <motion.aside
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 360, damping: 36 }}
          className="fixed inset-y-0 left-0 z-[61] flex w-full max-w-lg flex-col border-e border-subtle bg-base shadow-2xl"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
            <div className="flex shrink-0 items-center justify-between border-b border-subtle bg-surface px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Package className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              id="service-form"
              onSubmit={handleSubmit(onSubmit)}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6"
              noValidate
            >
              <div>
                <label htmlFor="service-name" className="mb-1.5 block text-sm text-muted">
                  {t("name")}
                </label>
                <input
                  id="service-name"
                  {...register("name")}
                  className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  placeholder={t("namePlaceholder")}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="service-duration" className="mb-1.5 block text-sm text-muted">
                    {t("duration")}
                  </label>
                  <select
                    id="service-duration"
                    {...register("durationMinutes", { valueAsNumber: true })}
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  >
                    {DURATION_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {t("durationOption", { minutes })}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.durationMinutes?.message} />
                </div>

                <div>
                  <label htmlFor="service-price" className="mb-1.5 block text-sm text-muted">
                    {isPackage ? t("packagePrice") : t("price")}
                  </label>
                  <input
                    id="service-price"
                    type="number"
                    min={0}
                    {...register("priceEgp", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                    placeholder={t("pricePlaceholder")}
                  />
                  <FieldError message={errors.priceEgp?.message} />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-subtle bg-surface p-4">
                <span>
                  <span className="block text-sm font-semibold text-primary">
                    {t("packageToggle")}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {t("packageToggleHint")}
                  </span>
                </span>
                <span
                  className={[
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                    isPackage ? "bg-accent" : "bg-subtle",
                  ].join(" ")}
                >
                  <input
                    {...register("isPackage")}
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <span
                    className={[
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
                      isPackage ? "end-1" : "end-6",
                    ].join(" ")}
                  />
                </span>
              </label>

              <AnimatePresence initial={false}>
                {isPackage ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                      <label
                        htmlFor="service-sessions"
                        className="mb-1.5 block text-sm text-muted"
                      >
                        {t("sessionsCount")}
                      </label>
                      <input
                        id="service-sessions"
                        type="number"
                        min={2}
                        max={100}
                        {...register("sessionsCount", { valueAsNumber: true })}
                        className="w-full rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                      />
                      <FieldError message={errors.sessionsCount?.message} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted">
                  <Palette className="h-4 w-4" aria-hidden />
                  <span>{t("color")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setValue("colorCode", color, { shouldValidate: true })
                      }
                      aria-label={color}
                      className={[
                        "h-9 w-9 rounded-full border-2 transition hover:scale-110",
                        colorCode === color
                          ? "border-primary ring-2 ring-accent/30"
                          : "border-surface",
                      ].join(" ")}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={colorCode ?? "#00CEC9"}
                    onChange={(event) =>
                      setValue("colorCode", event.target.value, {
                        shouldValidate: true,
                      })
                    }
                    aria-label={t("customColor")}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-subtle bg-surface p-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setValue("colorCode", null, { shouldValidate: true })
                    }
                    className="rounded-lg border border-subtle px-3 py-2 text-xs text-muted transition hover:bg-elevated"
                  >
                    {t("noColor")}
                  </button>
                </div>
                <FieldError message={errors.colorCode?.message} />
              </div>

              <div>
                <label htmlFor="service-instructions" className="mb-1.5 block text-sm text-muted">
                  {t("instructions")}
                </label>
                <textarea
                  id="service-instructions"
                  rows={4}
                  {...register("preVisitInstructions", {
                    setValueAs: (value) =>
                      typeof value === "string" ? value.trim() || null : null,
                  })}
                  className="w-full resize-none rounded-xl border border-subtle bg-surface px-4 py-3 text-sm text-primary outline-none ring-accent/40 focus:ring-2"
                  placeholder={t("instructionsPlaceholder")}
                />
                <FieldError message={errors.preVisitInstructions?.message} />
              </div>

              {errors.root?.message ? (
                <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger">
                  {errors.root.message}
                </p>
              ) : null}
            </form>

              <div className="flex shrink-0 gap-3 border-t border-subtle bg-surface px-5 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-subtle px-4 py-3 text-sm font-medium text-muted transition hover:bg-surface"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  form="service-form"
                  disabled={isPending}
                  className="inline-flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("saving")}
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden />
                      {t("save")}
                    </>
                  )}
                </button>
              </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1.5 text-xs text-accent-danger">{message}</p>
  ) : null;
}
