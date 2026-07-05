"use client";

import { useTranslations } from "next-intl";
import { Phone, ShieldAlert } from "lucide-react";

interface SoftBanCardProps {
  clinicName: string;
  whatsappNumber: string;
}

export function SoftBanCard({ clinicName, whatsappNumber }: SoftBanCardProps) {
  const t = useTranslations("booking");
  const telHref = `tel:${whatsappNumber.replace(/\s/g, "")}`;

  return (
    <div
      role="alert"
      className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-start shadow-sm"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
        <ShieldAlert className="h-7 w-7 text-amber-600" aria-hidden />
      </div>

      <h3 className="mb-2 text-lg font-semibold text-amber-950">{t("softBanTitle")}</h3>
      <p className="mb-4 text-sm leading-relaxed text-amber-900/80">
        {t("softBanBody", { clinic: clinicName })}
      </p>

      <a
        href={telHref}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]"
      >
        <Phone className="h-4 w-4" aria-hidden />
        {t("callClinic", { phone: whatsappNumber })}
      </a>
    </div>
  );
}
