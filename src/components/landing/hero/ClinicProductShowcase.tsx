"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  MessageCircle,
  Stethoscope,
  Wallet,
  ClipboardList,
  Users,
} from "lucide-react";

const STEPS = ["schedule", "queue", "doctor", "records"] as const;

export function ClinicProductShowcase() {
  const t = useTranslations("landing.hero.showcase");
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const active = STEPS[step];

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-subtle/80 bg-surface/80 p-4 shadow-[0_24px_80px_rgba(10,10,15,0.18)] backdrop-blur-md md:p-5"
      role="img"
      aria-label={t("ariaLabel")}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-success/8"
        aria-hidden
      />

      <div className="relative mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">{t("clinic")}</p>
          <p className="text-sm font-semibold text-primary">{t("title")}</p>
        </div>
        <span className="rounded-full border border-accent-success/30 bg-accent-success/10 px-2.5 py-1 text-[10px] font-semibold text-accent-success">
          {t("live")}
        </span>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        <MiniCard
          icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden />}
          label={t("schedule")}
          active={active === "schedule"}
        >
          <ul className="space-y-1.5">
            {[t("slot1"), t("slot2"), t("slot3")].map((slot, index) => (
              <li
                key={slot}
                className={[
                  "rounded-lg border px-2 py-1.5 text-[11px]",
                  active === "schedule" && index === 1
                    ? "border-accent/40 bg-accent/10 text-primary"
                    : "border-subtle bg-elevated/40 text-muted",
                ].join(" ")}
              >
                {slot}
              </li>
            ))}
          </ul>
        </MiniCard>

        <MiniCard
          icon={<Users className="h-3.5 w-3.5" aria-hidden />}
          label={t("queue")}
          active={active === "queue"}
        >
          <div className="space-y-1.5">
            {[t("patient1"), t("patient2"), t("patient3")].map((name, index) => (
              <div
                key={name}
                className={[
                  "flex items-center justify-between rounded-lg border px-2 py-1.5 text-[11px]",
                  active === "queue" && index === 0
                    ? "border-accent/40 bg-accent/10"
                    : "border-subtle bg-elevated/40",
                ].join(" ")}
              >
                <span className="font-medium text-primary">{name}</span>
                <span className="text-muted">
                  {index === 0 ? t("waiting") : t("outside")}
                </span>
              </div>
            ))}
          </div>
        </MiniCard>

        <MiniCard
          icon={<Stethoscope className="h-3.5 w-3.5" aria-hidden />}
          label={t("doctor")}
          active={active === "doctor"}
        >
          <div className="rounded-lg border border-subtle bg-elevated/40 px-2.5 py-2">
            <p className="text-[11px] font-semibold text-primary">{t("doctorName")}</p>
            <p className="mt-1 text-[10px] text-accent-success">{t("doctorStatus")}</p>
            <p className="mt-2 text-[10px] text-muted">{t("doctorPatient")}</p>
          </div>
        </MiniCard>

        <MiniCard
          icon={<ClipboardList className="h-3.5 w-3.5" aria-hidden />}
          label={t("records")}
          active={active === "records"}
        >
          <div className="space-y-1.5 text-[10px] text-muted">
            <p className="rounded-lg border border-subtle bg-elevated/40 px-2 py-1.5">
              {t("recordNote")}
            </p>
            <p className="rounded-lg border border-subtle bg-elevated/40 px-2 py-1.5">
              {t("prescription")}
            </p>
          </div>
        </MiniCard>
      </div>

      <div className="relative mt-3 grid gap-3 sm:grid-cols-3">
        <MiniCard
          icon={<Wallet className="h-3.5 w-3.5" aria-hidden />}
          label={t("revenue")}
          compact
        >
          <p className="text-sm font-semibold tabular-nums text-accent-success">
            {t("revenueValue")}
          </p>
        </MiniCard>
        <MiniCard
          icon={<MessageCircle className="h-3.5 w-3.5" aria-hidden />}
          label={t("whatsapp")}
          compact
        >
          <p className="text-[10px] leading-relaxed text-muted">{t("whatsappHint")}</p>
        </MiniCard>
        <MiniCard label={t("timeline")} compact>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={[
                  "h-1.5 flex-1 rounded-full",
                  index <= step ? "bg-accent" : "bg-subtle",
                ].join(" ")}
              />
            ))}
          </div>
        </MiniCard>
      </div>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  children,
  active = false,
  compact = false,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-base/40 transition duration-300",
        compact ? "p-3" : "p-3",
        active ? "border-accent/40 shadow-[0_0_24px_rgba(108,92,231,0.12)]" : "border-subtle/80",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
