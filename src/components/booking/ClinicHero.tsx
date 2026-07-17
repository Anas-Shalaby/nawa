"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, ImageIcon, MapPin, Phone, UserRound } from "lucide-react";
import type { Tenant } from "@/lib/booking/types";

interface ClinicHeroProps {
  tenant: Tenant;
}

export function ClinicHero({ tenant }: ClinicHeroProps) {
  const t = useTranslations("booking");
  const hasCoordinates =
    tenant.latitude !== null && tenant.longitude !== null;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${tenant.latitude},${tenant.longitude}`
    : tenant.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.location)}`
      : null;

  return (
    <header className="pb-6 text-center" dir="rtl">
      <div className="relative">
        <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-booking-accent-light via-gray-100 to-gray-200">
          {tenant.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" aria-hidden />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-booking-bg/90 via-booking-bg/20 to-transparent" />
        </div>

        <div className="relative z-10 -mt-12 flex justify-center px-5">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-booking-surface bg-gray-100 shadow-md">
            {tenant.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.avatarUrl}
                alt={tenant.doctorName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <UserRound className="h-10 w-10" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 px-5">
        <div className="inline-flex items-center justify-center gap-1.5">
          <h1 className="text-xl font-bold text-booking-text">{tenant.doctorName}</h1>
          <BadgeCheck
            className="h-5 w-5 shrink-0 text-sky-500"
            aria-label={t("verified")}
          />
        </div>

        {tenant.specialty ? (
          <p className="mt-1 text-sm text-booking-muted">{tenant.specialty}</p>
        ) : (
          <p className="mt-1 text-sm text-booking-muted">{tenant.name}</p>
        )}

        {tenant.whatsappNumber || mapsUrl ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {tenant.whatsappNumber ? (
              <a
                href={`tel:${tenant.whatsappNumber.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-booking-surface px-3 py-1.5 text-xs text-booking-muted shadow-sm transition hover:text-booking-accent"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {tenant.whatsappNumber}
              </a>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-booking-surface px-3 py-1.5 text-xs text-booking-muted shadow-sm transition hover:text-booking-accent"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {tenant.location || t("getDirections")}
              </a>
            ) : null}
          </div>
        ) : null}

        {tenant.credentials.length > 0 ? (
          <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tenant.credentials.map(( cred) => (
              <span
                key={cred}
                className="shrink-0 rounded-full border border-gray-100 bg-booking-surface px-4 py-1.5 text-sm text-booking-text shadow-sm"
              >
                {cred}
              </span>
            ))}
          </div>
        ) : null}

        {tenant.bio ? (
          <p className="mt-4 text-start text-sm leading-relaxed text-booking-muted">
            {tenant.bio}
          </p>
        ) : (
          <p className="mt-4 text-sm text-booking-muted">{t("whatsappConfirm")}</p>
        )}
      </div>
    </header>
  );
}
