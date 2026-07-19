"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardList,
  LayoutGrid,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatAppointmentTime, formatCairoDateShort } from "@/lib/datetime/cairo";
import type { TodayDashboardSnapshot } from "@/lib/queries/todayDashboardSnapshot";

function greetingKey(now = new Date()): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Cairo",
    }).format(now),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatMoney(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  href?: string;
  tone?: "default" | "accent" | "danger";
}) {
  const valueClass =
    tone === "danger"
      ? "text-accent-danger"
      : tone === "accent"
        ? "text-accent"
        : "text-primary";

  const inner = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-subtle bg-surface p-5 transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5">{inner}</div>
  );
}

function Panel({
  title,
  href,
  linkLabel,
  children,
  empty,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  empty?: string;
}) {
  const hasContent = children != null && children !== false && children !== "";
  return (
    <section className="rounded-2xl border border-subtle bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
        {href && linkLabel ? (
          <Link
            href={href}
            className="text-xs font-medium text-accent transition hover:opacity-80"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {hasContent ? (
        children
      ) : empty ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : null}
    </section>
  );
}

export function TodayDashboardShell(props: TodayDashboardSnapshot) {
  const t = useTranslations("dashboard.todayHome");
  const locale = useLocale() as Locale;
  const dateLabel = formatCairoDateShort(props.date, locale);
  const greet = t(`greeting.${greetingKey()}`, { name: props.greetingName });
  const revenue =
    props.canViewRevenue && props.metrics.todayRevenueEgp != null
      ? formatMoney(props.metrics.todayRevenueEgp, locale)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-1 pb-10 pt-2">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          {greet}
        </h1>
        <p className="text-sm text-muted">
          {props.clinicName} · {dateLabel}
        </p>
        <p className="pt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <section aria-label={t("quickActions")} className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/floor"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
          {t("actions.openFloor")}
        </Link>
        {props.canViewAppointments ? (
          <Link
            href="/dashboard/upcoming"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-subtle bg-surface px-4 text-sm font-medium text-primary transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {t("actions.book")}
          </Link>
        ) : null}
        {props.canViewPatients ? (
          <Link
            href="/dashboard/patients"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-subtle bg-surface px-4 text-sm font-medium text-primary transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <Users className="h-4 w-4" aria-hidden />
            {t("actions.patients")}
          </Link>
        ) : null}
        {props.canViewAppointments ? (
          <Link
            href="/dashboard/upcoming"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-subtle bg-surface px-4 text-sm font-medium text-primary transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <ClipboardList className="h-4 w-4" aria-hidden />
            {t("actions.agenda")}
          </Link>
        ) : null}
      </section>

      <section
        aria-label={t("kpis")}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <KpiCard
          label={t("kpi.appointments")}
          value={String(props.metrics.totalToday)}
          href="/dashboard/floor"
        />
        <KpiCard
          label={t("kpi.waiting")}
          value={String(props.metrics.waitingNow)}
          href="/dashboard/floor"
          tone={props.metrics.waitingNow > 0 ? "accent" : "default"}
        />
        <KpiCard
          label={t("kpi.completed")}
          value={String(props.metrics.completed)}
          href="/dashboard/floor"
        />
        {revenue != null ? (
          <KpiCard
            label={t("kpi.revenue")}
            value={revenue}
            href="/dashboard/financials"
          />
        ) : null}
        {props.canViewRevenue && props.outstandingDebtsEgp != null ? (
          <KpiCard
            label={t("kpi.outstanding")}
            value={formatMoney(props.outstandingDebtsEgp, locale)}
            href="/dashboard/financials"
            tone={props.outstandingDebtsEgp > 0 ? "danger" : "default"}
          />
        ) : null}
        {props.canViewInventory && props.inventoryLowStockCount != null ? (
          <KpiCard
            label={t("kpi.inventory")}
            value={String(props.inventoryLowStockCount)}
            href="/dashboard/inventory"
            tone={props.inventoryLowStockCount > 0 ? "danger" : "default"}
          />
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title={t("queue.title")}
          href="/dashboard/floor"
          linkLabel={t("viewAll")}
          empty={t("queue.empty")}
        >
          {props.queueWaiting.length > 0 ? (
            <ul className="space-y-3">
              {props.queueWaiting.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {item.patientName}
                    </p>
                    <p className="truncate text-xs text-muted">{item.serviceName}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatAppointmentTime(item.appointmentDate, locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel
          title={t("upcoming.title")}
          href="/dashboard/upcoming"
          linkLabel={t("viewAll")}
          empty={t("upcoming.empty")}
        >
          {props.upcoming.length > 0 ? (
            <ul className="space-y-3">
              {props.upcoming.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {item.patientName}
                    </p>
                    <p className="truncate text-xs text-muted">{item.serviceName}</p>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {formatAppointmentTime(item.appointmentDate, locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>

        <Panel
          title={t("team.title")}
          href="/dashboard/staff"
          linkLabel={t("viewAll")}
          empty={t("team.empty")}
        >
          {props.doctors.length > 0 ? (
            <ul className="space-y-3">
              {props.doctors.map((doctor) => (
                <li key={doctor.id} className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-primary">
                    {doctor.displayName}
                  </p>
                  <span
                    className={[
                      "shrink-0 text-xs font-medium",
                      doctor.availability === "available"
                        ? "text-accent"
                        : "text-muted",
                    ].join(" ")}
                  >
                    {t(`team.status.${doctor.availability}`)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      </div>

      {props.canViewPatients ? (
        <Panel
          title={t("recentPatients.title")}
          href="/dashboard/patients"
          linkLabel={t("viewAll")}
          empty={t("recentPatients.empty")}
        >
          {props.recentPatients.length > 0 ? (
            <ul className="divide-y divide-subtle">
              {props.recentPatients.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/dashboard/patients/${patient.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">
                        {patient.name}
                      </p>
                      <p className="truncate text-xs text-muted" dir="ltr">
                        {patient.phoneNumber}
                      </p>
                    </div>
                    {patient.totalBalanceDue > 0 && props.canViewRevenue ? (
                      <span className="inline-flex items-center gap-1 text-xs text-accent-danger">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {formatMoney(patient.totalBalanceDue, locale)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </Panel>
      ) : null}
    </div>
  );
}
