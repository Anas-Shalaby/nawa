"use client";

import { useTranslations } from "next-intl";
import type { Tenant } from "@/lib/booking/types";

interface ClinicHeroProps {
  tenant: Tenant;
}

export function ClinicHero({ tenant }: ClinicHeroProps) {
  const t = useTranslations("booking");

  return (
    <header className="px-5 pb-6 pt-8 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
        {tenant.type === "dental" ? <StylizedToothIcon /> : <StylizedSkinIcon />}
      </div>

      <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-booking-muted">
        {t("bookWith")}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-booking-text">
        {tenant.name}
      </h1>
      <p className="mt-2 text-sm text-booking-muted">{t("whatsappConfirm")}</p>
    </header>
  );
}

function StylizedToothIcon() {
  return (
    <div
      className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-booking-accent-light to-white shadow-sm ring-1 ring-booking-accent/10"
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none">
        <path
          d="M32 8c-8 0-14 6-14 14 0 4 1 8 3 11l4 18c1 4 5 7 9 7h4c4 0 8-3 9-7l4-18c2-3 3-7 3-11 0-8-6-14-14-14z"
          fill="#6C5CE7"
          fillOpacity="0.15"
          stroke="#6C5CE7"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="26" r="2" fill="#6C5CE7" fillOpacity="0.4" />
        <circle cx="38" cy="26" r="2" fill="#6C5CE7" fillOpacity="0.4" />
      </svg>
    </div>
  );
}

function StylizedSkinIcon() {
  return (
    <div
      className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-50 to-white shadow-sm ring-1 ring-teal-200/50"
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none">
        <path
          d="M32 12l12 7v14l-12 7-12-7V19l12-7z"
          fill="#00CEC9"
          fillOpacity="0.2"
          stroke="#00CEC9"
          strokeWidth="2"
        />
        <path
          d="M32 28l8 4.5v9L32 46l-8-4.5v-9l8-4.5z"
          fill="#00CEC9"
          fillOpacity="0.35"
          stroke="#00CEC9"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
