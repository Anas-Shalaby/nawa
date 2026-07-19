"use client";

import QRCode from "react-qr-code";
import { useTranslations } from "next-intl";
import {
  formatLineInstruction,
  prescriptionQrValue,
} from "@/lib/clinical/prescriptionFormat";
import type { PrescriptionLineInput } from "@/lib/clinical/prescriptionTypes";

export interface PrescriptionPaperProps {
  paperId?: string;
  clinicName: string;
  doctorName: string;
  specialty?: string;
  clinicPhone?: string;
  clinicLocation?: string;
  logoUrl?: string | null;
  patientName: string;
  patientAgeLabel?: string;
  dateLabel: string;
  lines: PrescriptionLineInput[];
  publicToken?: string | null;
  className?: string;
}

export function PrescriptionPaper({
  paperId = "nawa-prescription-paper",
  clinicName,
  doctorName,
  specialty,
  clinicPhone,
  clinicLocation,
  logoUrl,
  patientName,
  patientAgeLabel,
  dateLabel,
  lines,
  publicToken,
  className = "",
}: PrescriptionPaperProps) {
  const t = useTranslations("prescription");
  const qrValue = publicToken
    ? prescriptionQrValue(
        publicToken,
        typeof window !== "undefined" ? window.location.origin : undefined,
      )
    : null;

  return (
    <div
      id={paperId}
      className={[
        "relative mx-auto aspect-[210/297] w-full max-w-[420px] overflow-hidden bg-white p-6 text-[#111827] shadow-2xl sm:p-8",
        className,
      ].join(" ")}
      dir="rtl"
      style={{ fontFamily: "Tahoma, 'Segoe UI', Arial, sans-serif" }}
    >
      <div className="pointer-events-none absolute -start-2 top-28 select-none font-serif text-[110px] leading-none text-[#0d9488]/10">
        Rx
      </div>

      <header className="relative z-10 border-b border-gray-200 pb-4 text-start">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0d9488]/10 text-sm font-bold text-[#0d9488]">
                {(clinicName.trim()[0] ?? "ن").toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-base font-bold text-gray-900">{doctorName}</p>
              <p className="text-xs text-gray-500">
                {specialty?.trim() || clinicName}
              </p>
              {clinicPhone ? (
                <p className="mt-0.5 text-[10px] text-gray-400" dir="ltr">
                  {clinicPhone}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-end">
            <p className="text-xs font-semibold text-gray-800">{clinicName}</p>
            {clinicLocation ? (
              <p className="mt-0.5 max-w-[9rem] text-[10px] leading-snug text-gray-400">
                {clinicLocation}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-1 text-[11px] text-gray-600 sm:grid-cols-3">
          <p>
            <span className="text-gray-400">{t("paperPatient")}: </span>
            {patientName}
          </p>
          <p>
            <span className="text-gray-400">{t("paperAge")}: </span>
            {patientAgeLabel ?? t("paperAgeUnknown")}
          </p>
          <p>
            <span className="text-gray-400">{t("paperDate")}: </span>
            {dateLabel}
          </p>
        </div>
      </header>

      <div className="relative z-10 mt-5 min-h-[46%] space-y-3.5 text-start">
        {lines.length === 0 ? (
          <p className="pt-10 text-center text-sm text-gray-400">{t("paperEmpty")}</p>
        ) : (
          lines.map((line, index) => (
            <div
              key={`${line.medicineName}-${index}`}
              className="border-b border-gray-100 pb-2.5"
            >
              <p className="text-sm font-semibold text-gray-900">
                {index + 1}. {line.medicineName}
                {line.isChronic ? (
                  <span className="ms-2 text-[10px] font-medium text-[#0d9488]">
                    {t("chronicBadge")}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {formatLineInstruction(line)}
              </p>
            </div>
          ))
        )}
      </div>

      <footer className="absolute inset-x-6 bottom-6 z-10 sm:inset-x-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="w-36 border-t border-gray-300 pt-2 text-center text-[10px] text-gray-500">
            {t("signature")}
          </div>
          {qrValue ? (
            <div className="flex flex-col items-center gap-1">
              <div className="rounded bg-white p-1">
                <QRCode value={qrValue} size={56} />
              </div>
              <span className="text-[9px] text-gray-400">{t("qrHint")}</span>
            </div>
          ) : null}
        </div>
        <p className="text-center text-[10px] text-gray-400">{clinicName}</p>
        <p className="mt-1 text-center text-[10px] font-medium text-[#0d9488]">
          {t("issuedBy")}
        </p>
      </footer>
    </div>
  );
}
