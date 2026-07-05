"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, XCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { cancelAppointment } from "@/actions/cancelAppointment";
import type { BookingTicketView } from "@/lib/queries/bookingTicket";

interface DigitalSuccessTicketProps {
  ticket: BookingTicketView;
  accessToken: string;
  verifyUrl: string;
}

function PerforationEdge({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 h-3",
        position === "top" ? "-top-1.5" : "-bottom-1.5",
      ].join(" ")}
      style={{
        backgroundImage:
          "radial-gradient(circle at 8px 50%, #0A0A0F 5px, transparent 5.5px)",
        backgroundSize: "16px 12px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
      aria-hidden
    />
  );
}

export function DigitalSuccessTicket({
  ticket,
  accessToken,
  verifyUrl,
}: DigitalSuccessTicketProps) {
  const t = useTranslations("booking.ticket");
  const [isCancelled, setIsCancelled] = useState(ticket.status === "canceled");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setCancelError(null);

    startTransition(async () => {
      const result = await cancelAppointment(
        ticket.appointmentId,
        ticket.clinicSlug,
        accessToken,
      );

      if (!result.success) {
        setCancelError(result.error ?? t("cancelError"));
        return;
      }

      setIsCancelled(true);
    });
  }

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[100dvh] flex-col items-center justify-center bg-base px-5 py-12 text-center"
      >
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-subtle bg-surface">
          <XCircle className="h-10 w-10 text-muted" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-primary">{t("cancelledTitle")}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {t("cancelledBody", { time: ticket.timeLabel })}
        </p>
      </motion.div>
    );
  }

  const detailRows = [
    { label: t("bookingNumber"), value: `#${ticket.bookingRef}` },
    { label: t("patient"), value: ticket.patientName },
    { label: t("date"), value: ticket.dateLabel },
    { label: t("time"), value: ticket.timeLabel },
    { label: t("service"), value: ticket.serviceName },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-base px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(108,92,231,0.22),transparent)]"
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-md"
      >
        <article
          className={[
            "relative overflow-hidden rounded-3xl border border-subtle/80 bg-surface/90",
            "shadow-[0_32px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
            "backdrop-blur-sm",
          ].join(" ")}
        >
          <PerforationEdge position="top" />
          <div
            className="pointer-events-none absolute inset-x-8 top-[46%] h-px border-t border-dashed border-subtle/80"
            aria-hidden
          />

          <div className="relative border-b border-subtle/60 px-6 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl"
              />
            </div>
            <p className="text-sm font-medium text-muted">{ticket.clinicName}</p>
            <h1 className="mt-4 text-balance text-xl font-semibold leading-snug text-primary sm:text-2xl">
              {t("congrats", { name: ticket.patientName.split(" ")[0] ?? ticket.patientName })}
            </h1>
            <p className="mt-2 text-xs tracking-[0.2em] text-accent uppercase">{t("digitalPass")}</p>
          </div>

          <div className="space-y-4 px-6 py-6">
            {detailRows.map((row, index) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + index * 0.05, duration: 0.4 }}
                className="flex items-start justify-between gap-4 border-b border-subtle/40 pb-3 text-start last:border-0 last:pb-0"
              >
                <span className="text-xs font-medium text-muted">{row.label}</span>
                <span className="text-end text-sm font-semibold text-primary">{row.value}</span>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38, duration: 0.45 }}
              className="mx-auto mt-2 flex w-fit flex-col items-center rounded-2xl border border-subtle/70 bg-base/80 p-4"
            >
              <QRCode
                value={verifyUrl}
                size={128}
                bgColor="#0A0A0F"
                fgColor="#F0F0F5"
                level="M"
                className="rounded-lg"
              />
              <p className="mt-3 text-[11px] text-muted">{t("scanToVerify")}</p>
            </motion.div>
          </div>

          <PerforationEdge position="bottom" />

          <div className="space-y-3 border-t border-subtle/60 bg-elevated/30 px-6 py-5">
            <a
              href={ticket.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl",
                "bg-[#4285F4] px-4 py-3 text-sm font-semibold text-white",
                "shadow-[0_12px_32px_rgba(66,133,244,0.35)] transition",
                "hover:brightness-110 active:scale-[0.98]",
              ].join(" ")}
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {t("directions")}
            </a>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className={[
                "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl",
                "border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300",
                "transition hover:border-red-400/40 hover:bg-red-500/15 active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <XCircle className="h-4 w-4" aria-hidden />
              {isPending ? t("cancelling") : t("cancelBooking")}
            </button>

            {cancelError ? (
              <p className="text-center text-xs text-red-400/90" role="alert">
                {cancelError}
              </p>
            ) : null}
          </div>
        </article>
      </motion.div>
    </div>
  );
}
