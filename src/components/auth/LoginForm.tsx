"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail } from "lucide-react";
import { z } from "zod";
import { Link } from "@/i18n/navigation";
import { loginClinic } from "@/actions/loginClinic";
import type { LoginClinicErrorCode } from "@/actions/loginClinic.types";
import { AuthField } from "./AuthField";

const ERROR_KEYS: Record<LoginClinicErrorCode, string> = {
  INVALID_CREDENTIALS: "errors.invalidCredentials",
  INVALID_EMAIL: "errors.invalidEmail",
  UNKNOWN: "errors.unknown",
};

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t("errors.invalidEmail")),
        password: z.string().min(1, t("errors.passwordRequired")),
      }),
    [t],
  );

  type LoginFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginFormValues) {
    setServerError(null);

    startTransition(async () => {
      const result = await loginClinic({
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
          autoComplete="current-password"
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
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-slate-300 transition hover:text-white">
          {t("registerLink")}
        </Link>
      </p>
    </motion.div>
  );
}
