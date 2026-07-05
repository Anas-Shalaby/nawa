"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { registerClinic } from "@/actions/registerClinic";
import type { RegisterClinicErrorCode } from "@/actions/registerClinic.types";
import { AuthField } from "./AuthField";

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
      transition={{ duration: 0.45, delay: 0.08 }}
    >
      <div className="mb-8 text-start">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AuthField
          id="clinicName"
          label={t("clinicName")}
          icon={Building2}
          autoComplete="organization"
          placeholder={t("clinicNamePlaceholder")}
          error={errors.clinicName?.message}
          {...register("clinicName")}
        />

        <AuthField
          id="email"
          label={t("email")}
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          id="password"
          label={t("password")}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          placeholder={t("passwordPlaceholder")}
          error={errors.password?.message}
          {...register("password")}
        />

        {serverError ? (
          <p className="text-sm text-red-400/90" role="alert">
            {serverError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className={[
            "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3",
            "text-sm font-semibold text-white shadow-[0_0_32px_rgba(108,92,231,0.28)]",
            "transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
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

      <p className="mt-8 text-center text-sm text-slate-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-slate-300 transition hover:text-white">
          {t("loginLink")}
        </Link>
      </p>
    </motion.div>
  );
}
