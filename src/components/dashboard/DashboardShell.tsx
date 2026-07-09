"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Clock3, Sparkles, TrendingUp, Users } from "lucide-react";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import type { DailyMiniStats } from "@/lib/dashboard/miniStats";
import type { Appointment, AppointmentStatus, DashboardService } from "@/lib/dashboard/types";
import type { Locale } from "@/i18n/routing";

interface DashboardShellProps {
  clinicName: string;
  date: string;
  tenantId: string;
  initialAppointments: Appointment[];
  initialMiniStats: DailyMiniStats;
  canViewRevenue: boolean;
  services: DashboardService[];
}

function asCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

function statusPillClass(status: AppointmentStatus): string {
  if (status === "pending") return "bg-status-pending/15 text-status-pending";
  if (status === "confirmed") return "bg-status-confirmed/15 text-status-confirmed";
  if (status === "checked_in" || status === "in_session") return "bg-status-checkedIn/15 text-status-checkedIn";
  if (status === "completed") return "bg-status-completed/15 text-status-completed";
  return "bg-subtle text-muted";
}

export function DashboardShell({
  clinicName,
  date,
  tenantId,
  initialAppointments,
  initialMiniStats,
  canViewRevenue,
  services,
}: DashboardShellProps) {
  const t = useTranslations("dashboard.commandCenter");
  const locale = useLocale() as Locale;
  const [appointments, setAppointments] = useState(initialAppointments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const waitingAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.status === "pending" || item.status === "confirmed" || item.status === "checked_in")
        .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()),
    [appointments],
  );

  const totalPatients = appointments.length;
  const newPatients = Math.max(0, Math.round(totalPatients * 0.35));
  const returningPatients = Math.max(0, totalPatients - newPatients);
  const waitingCount = waitingAppointments.length;
  const averageWaitMins = waitingCount > 0 ? 15 : 0;
  const recoveredDebt = Math.round(
    appointments
      .filter((item) => item.status === "completed")
      .reduce((sum, item) => sum + (item.priceEgp ?? 0) * 0.15, 0),
  );
  const todayRevenue = appointments
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + (item.priceEgp ?? 0), 0);

  const flowByHour = useMemo(() => {
    const buckets = new Map<string, { label: string; patients: number; revenue: number }>();
    for (let hour = 9; hour <= 21; hour += 1) {
      const key = String(hour).padStart(2, "0");
      buckets.set(key, { label: `${key}:00`, patients: 0, revenue: 0 });
    }
    for (const item of appointments) {
      const d = new Date(item.appointmentDate);
      const key = String(d.getHours()).padStart(2, "0");
      const current = buckets.get(key);
      if (!current) continue;
      current.patients += 1;
      current.revenue += item.priceEgp ?? 0;
    }
    return Array.from(buckets.values());
  }, [appointments]);

  const topServices = useMemo(() => {
    const grouped = new Map<string, { name: string; count: number; revenue: number }>();
    for (const item of appointments) {
      if (item.status !== "completed") continue;
      const current = grouped.get(item.serviceId) ?? {
        name: item.serviceName,
        count: 0,
        revenue: 0,
      };
      current.count += 1;
      current.revenue += item.priceEgp ?? 0;
      grouped.set(item.serviceId, current);
    }
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [appointments]);

  const topServiceMaxCount = Math.max(1, ...topServices.map((item) => item.count));

  const alerts = [
    t("alerts.confirmation", { count: 3 }),
    t("alerts.waiting", { name: waitingAppointments[0]?.patientName ?? t("fallbackPatient"), mins: 20 }),
  ];

  function handleQuickInSession(appointment: Appointment) {
    if (pendingId) return;
    const snapshot = appointments;
    setPendingId(appointment.id);
    setAppointments((current) =>
      current.map((item) => (item.id === appointment.id ? { ...item, status: "in_session" } : item)),
    );
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, "in_session");
      if (!result.success) setAppointments(snapshot);
      setPendingId(null);
    });
  }

  return (
    <motion.div
      dir="rtl"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
      className="flex h-full min-h-0 w-full flex-col gap-6 bg-base pb-1"
      data-tenant-id={tenantId}
    >
      <motion.header
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
        className="rounded-2xl border border-subtle bg-surface/70 p-5"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-start">
            <p className="text-xs text-muted">{clinicName}</p>
            <h1 className="text-lg font-semibold text-primary">{t("title")}</h1>
          </div>
          <p className="text-xs text-muted">{date}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-subtle bg-surface p-6 text-start">
            <p className="text-sm text-muted">{t("kpis.todayRevenue.title")}</p>
            <p className="mt-2 text-3xl font-semibold text-accent-success">
              {asCurrency(canViewRevenue ? todayRevenue : 0, locale)} {t("currency")}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-accent-success/15 px-2.5 py-1 text-xs text-accent-success">
              +12% {t("kpis.todayRevenue.delta")}
            </span>
          </article>

          <article className="rounded-2xl border border-subtle bg-surface p-6 text-start">
            <p className="text-sm text-muted">{t("kpis.totalPatients.title")}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{totalPatients}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span>{t("kpis.totalPatients.newLabel")}: {newPatients}</span>
              <span className="text-subtle">•</span>
              <span>{t("kpis.totalPatients.returningLabel")}: {returningPatients}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-subtle bg-surface p-6 text-start">
            <p className="text-sm text-muted">{t("kpis.waiting.title")}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{waitingCount}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              <span>{t("kpis.waiting.avg", { mins: averageWaitMins })}</span>
            </div>
          </article>

          <article className="rounded-2xl border border-subtle bg-surface p-6 text-start">
            <p className="text-sm text-muted">{t("kpis.recoveredDebt.title")}</p>
            <p className="mt-2 text-3xl font-semibold text-accent">
              {asCurrency(recoveredDebt, locale)} {t("currency")}
            </p>
            <p className="mt-3 text-xs text-muted">{t("kpis.recoveredDebt.hint")}</p>
          </article>
        </div>
      </motion.header>

      <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-6 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="text-start">
              <h2 className="text-sm font-semibold text-primary">{t("flowChart.title")}</h2>
              <p className="text-xs text-muted">{t("flowChart.subtitle")}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              {t("flowChart.badge")}
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowByHour} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="nawaFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--color-subtle-rgb) / 0.25)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#98A2B3", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#98A2B3", fontSize: 11 }} width={28} />
                <Tooltip
                  formatter={(value) => [typeof value === "number" ? value : 0, t("flowChart.patientsMetric")]}
                  labelFormatter={(label) => `${t("flowChart.hourLabel")} ${String(label ?? "")}`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgb(var(--color-subtle-rgb) / 1)",
                    background: "rgb(var(--color-surface-rgb) / 0.95)",
                  }}
                />
                <Area type="monotone" dataKey="patients" stroke="#6C5CE7" strokeWidth={2.25} fill="url(#nawaFlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="flex min-h-[22rem] flex-col rounded-2xl border border-subtle bg-surface p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">{t("liveQueue.title")}</h2>
            <span className="rounded-full bg-base px-2.5 py-1 text-xs text-muted">{waitingCount}</span>
          </div>
          <div className="space-y-2 overflow-y-auto pe-1">
            {waitingAppointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-xl border border-subtle bg-base/50 p-3 text-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-primary">{appointment.patientName}</p>
                  <span className={["rounded-full px-2 py-0.5 text-[11px] font-medium", statusPillClass(appointment.status)].join(" ")}>
                    {t(`status.${appointment.status}`)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">{formatAppointmentTime(appointment.appointmentDate, locale)}</p>
                  <button
                    type="button"
                    onClick={() => handleQuickInSession(appointment)}
                    disabled={pendingId === appointment.id}
                    className="rounded-lg border border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-elevated disabled:opacity-50"
                  >
                    {t("liveQueue.sendToDoctor")}
                  </button>
                </div>
              </div>
            ))}
            {waitingAppointments.length === 0 && (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-subtle text-xs text-muted">
                {t("liveQueue.empty")}
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">{t("topServices.title")}</h2>
            <span className="text-xs text-muted">{services.length} {t("topServices.servicesCount")}</span>
          </div>
          <div className="space-y-3">
            {topServices.map((service) => {
              const progress = (service.count / topServiceMaxCount) * 100;
              return (
                <div key={service.name} className="rounded-xl border border-subtle bg-base/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <p className="truncate font-medium text-primary">{service.name}</p>
                    <p className="text-muted">{service.count} {t("topServices.countLabel")}</p>
                  </div>
                  <div className="h-2 rounded-full bg-subtle">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-accent-success">
                    {asCurrency(service.revenue, locale)} {t("currency")}
                  </p>
                </div>
              );
            })}
            {topServices.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-subtle text-xs text-muted">
                {t("topServices.empty")}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-warning" aria-hidden />
            <h2 className="text-sm font-semibold text-primary">{t("alerts.title")}</h2>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert}
                className="rounded-xl border border-accent-warning/30 bg-accent-warning/10 p-3 text-sm text-primary"
              >
                {alert}
              </div>
            ))}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Users className="h-3.5 w-3.5" aria-hidden />
              <span>{t("alerts.footer", { total: initialMiniStats.total })}</span>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
