"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { registerClinic } from "@/actions/registerClinic";
import type { RegisterClinicErrorCode } from "@/actions/registerClinic.types";

const ERROR_KEYS: Record<RegisterClinicErrorCode, string> = {
  EMAIL_IN_USE: "errors.emailInUse",
  WEAK_PASSWORD: "errors.weakPassword",
  INVALID_EMAIL: "errors.invalidEmail",
  CLINIC_NAME_REQUIRED: "errors.clinicNameRequired",
  TENANT_CREATE_FAILED: "errors.tenantCreateFailed",
  SIGN_IN_FAILED: "errors.signInFailed",
  UNKNOWN: "errors.unknown",
};

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        clinicName: z.string().trim().min(2, t("errors.clinicNameRequired")),
        email: z.string().trim().email(t("errors.invalidEmail")),
        password: z.string().min(6, t("errors.weakPassword")),
      }),
    [t],
  );

  type RegisterFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clinicName: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    startTransition(async () => {
      const result = await registerClinic({
        clinicName: values.clinicName,
        email: values.email,
        password: values.password,
        locale,
      });

      if (!result.success) {
        const key = result.errorCode ? ERROR_KEYS[result.errorCode] : ERROR_KEYS.UNKNOWN;
        setServerError(t(key as "errors.unknown"));
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl dark:border-subtle dark:bg-elevated"
    >
      <div className="mb-8 text-start">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15">
          <Building2 className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-primary">{t("title")}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-muted">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="clinicName" className="mb-1.5 block text-sm text-zinc-600 dark:text-muted">
            {t("clinicName")}
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="clinicName"
              {...register("clinicName")}
              autoComplete="organization"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pe-4 ps-10 text-sm text-zinc-900 outline-none ring-accent/40 focus:ring-2 dark:border-subtle dark:bg-surface dark:text-primary"
              placeholder={t("clinicNamePlaceholder")}
            />
          </div>
          {errors.clinicName && (
            <p className="mt-1 text-xs text-accent-danger">{errors.clinicName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-600 dark:text-muted">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="email"
              type="email"
              {...register("email")}
              autoComplete="email"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pe-4 ps-10 text-sm text-zinc-900 outline-none ring-accent/40 focus:ring-2 dark:border-subtle dark:bg-surface dark:text-primary"
              placeholder="doctor@clinic.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-accent-danger">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-zinc-600 dark:text-muted">
            {t("password")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type="password"
              {...register("password")}
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pe-4 ps-10 text-sm text-zinc-900 outline-none ring-accent/40 focus:ring-2 dark:border-subtle dark:bg-surface dark:text-primary"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-accent-danger">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-xl border border-accent-danger/20 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
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
      </form>
    </motion.div>
  );
}
