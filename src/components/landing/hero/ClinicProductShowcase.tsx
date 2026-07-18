"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  MessageCircle,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";

const CYCLE = ["schedule", "queue", "messages", "payments"] as const;

export function ClinicProductShowcase() {
  const t = useTranslations("landing.hero.showcase");
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % CYCLE.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const active = CYCLE[step];

  return (
    <div
      className="relative isolate overflow-hidden rounded-[1.75rem] border border-subtle/80 bg-base/90 p-3 shadow-[0_28px_80px_rgba(10,10,15,0.22)] md:p-4"
      role="img"
      aria-label={t("ariaLabel")}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--accent)_/_0.12),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-medium text-muted">{t("clinic")}</p>
          <p className="text-sm font-semibold text-primary">{t("title")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-success/25 bg-accent-success/10 px-2.5 py-1 text-[10px] font-semibold text-accent-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-success" />
          {t("live")}
        </span>
      </div>

      <div className="relative grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <Widget
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label={t("schedule")}
            active={active === "schedule"}
          >
            <ul className="space-y-1.5">
              {[
                { slot: t("slot1"), tone: "muted" as const },
                { slot: t("slot2"), tone: "accent" as const },
                { slot: t("slot3"), tone: "muted" as const },
              ].map((item, index) => (
                <li
                  key={item.slot}
                  className={[
                    "flex items-center justify-between rounded-lg border px-2.5 py-2 text-[11px] transition",
                    active === "schedule" && index === 1
                      ? "border-accent/35 bg-accent/10 text-primary"
                      : "border-subtle/80 bg-elevated/40 text-muted",
                  ].join(" ")}
                >
                  <span className="font-medium">{item.slot}</span>
                  {index === 1 ? (
                    <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                      {t("now")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Widget>

          <Widget
            icon={<Users className="h-3.5 w-3.5" />}
            label={t("queue")}
            active={active === "queue"}
          >
            <div className="space-y-1.5">
              {[
                { name: t("patient1"), status: t("waiting") },
                { name: t("patient2"), status: t("outside") },
                { name: t("patient3"), status: t("outside") },
              ].map((patient, index) => (
                <div
                  key={patient.name}
                  className={[
                    "flex items-center justify-between rounded-lg border px-2.5 py-2 text-[11px]",
                    active === "queue" && index === 0
                      ? "border-accent/35 bg-accent/10"
                      : "border-subtle/80 bg-elevated/40",
                  ].join(" ")}
                >
                  <span className="font-medium text-primary">{patient.name}</span>
                  <span className="text-muted">{patient.status}</span>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        <div className="space-y-3">
          <Widget
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            label={t("doctor")}
            active={active === "schedule"}
          >
            <p className="text-[11px] font-semibold text-primary">{t("doctorName")}</p>
            <p className="mt-1 text-[10px] text-accent-success">{t("doctorStatus")}</p>
            <p className="mt-2 text-[10px] text-muted">{t("doctorPatient")}</p>
          </Widget>

          <Widget
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            label={t("whatsapp")}
            active={active === "messages"}
          >
            <div className="rounded-lg border border-subtle/80 bg-elevated/50 px-2.5 py-2">
              <p className="text-[10px] leading-relaxed text-muted">{t("whatsappHint")}</p>
              <p className="mt-2 text-[10px] font-medium text-accent-success">
                {t("whatsappReady")}
              </p>
            </div>
          </Widget>

          <div className="grid grid-cols-2 gap-3">
            <Widget
              icon={<Wallet className="h-3.5 w-3.5" />}
              label={t("revenue")}
              active={active === "payments"}
              compact
            >
              <p className="text-sm font-semibold tabular-nums text-accent-success">
                {t("revenueValue")}
              </p>
            </Widget>
            <Widget
              icon={<Bell className="h-3.5 w-3.5" />}
              label={t("followups")}
              compact
            >
              <p className="text-sm font-semibold tabular-nums text-primary">
                {t("followupsValue")}
              </p>
            </Widget>
          </div>

          <Widget
            icon={<ClipboardList className="h-3.5 w-3.5" />}
            label={t("records")}
            compact
          >
            <p className="text-[10px] text-muted">{t("recordNote")}</p>
          </Widget>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-1.5 px-1">
        {CYCLE.map((key, index) => (
          <motion.span
            key={key}
            className="h-1 flex-1 rounded-full bg-subtle"
            animate={
              reduceMotion
                ? undefined
                : { backgroundColor: index <= step ? "var(--accent)" : undefined }
            }
            style={
              index <= step
                ? { backgroundColor: "var(--accent)" }
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

function Widget({
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
        "rounded-xl border bg-surface/80 transition duration-500",
        compact ? "p-2.5" : "p-3",
        active
          ? "border-accent/30"
          : "border-subtle/70",
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
