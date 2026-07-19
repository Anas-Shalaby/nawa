"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, usePathname } from "@/i18n/navigation";
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import type { Locale } from "@/i18n/routing";

interface AnalyticsDashboardShellProps {
  analytics: DashboardAnalytics;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPct(value: number | null): string {
  if (value == null) return "—";
  return `${value}%`;
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="rounded-2xl border border-subtle bg-surface p-5 text-start">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-primary">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

export function AnalyticsDashboardShell({ analytics }: AnalyticsDashboardShellProps) {
  const t = useTranslations("dashboard.analyticsPage");
  const ta = useTranslations("dashboard.analytics");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const maxService = analytics.topServices[0]?.count ?? 1;

  const peakData = analytics.peakHours.filter((item) => item.count > 0);
  const trendData =
    analytics.rangeDays > 30
      ? analytics.reliabilityTrend.filter((_, index) => index % 3 === 0)
      : analytics.reliabilityTrend;

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 text-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div
          className="flex gap-1 rounded-xl border border-subtle bg-surface p-1"
          role="tablist"
          aria-label={t("rangeLabel")}
        >
          {([7, 30, 90] as const).map((days) => {
            const active = analytics.rangeDays === days;
            return (
              <Link
                key={days}
                href={`${pathname}?range=${days}`}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold transition",
                  active ? "bg-accent text-white" : "text-muted hover:text-primary",
                ].join(" ")}
                scroll={false}
              >
                {t(`range.${days}`)}
              </Link>
            );
          })}
        </div>
      </header>

      <section
        aria-label={t("kpis")}
        className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-5"
      >
        <Kpi
          label={t("kpi.newPatients")}
          value={String(analytics.newPatients)}
          hint={t("kpi.returningHint", { count: analytics.returningPatients })}
        />
        <Kpi
          label={t("kpi.returningRate")}
          value={formatPct(analytics.returningRate)}
        />
        <Kpi label={t("kpi.noShowRate")} value={formatPct(analytics.noShowRate)} />
        <Kpi label={t("kpi.cancelRate")} value={formatPct(analytics.cancelRate)} />
        <Kpi
          label={t("kpi.revenueGrowth")}
          value={
            analytics.revenueGrowthPct == null
              ? "—"
              : `${analytics.revenueGrowthPct > 0 ? "+" : ""}${analytics.revenueGrowthPct}%`
          }
          hint={t("kpi.revenueHint", {
            amount: formatMoney(analytics.periodRevenueEgp, locale),
            currency: ta("currency"),
          })}
        />
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi
          label={t("kpi.attendance")}
          value={formatPct(analytics.attendanceRate)}
          hint={t("kpi.completedHint", { count: analytics.totalCompleted })}
        />
        <Kpi
          label={t("kpi.avgWait")}
          value={
            analytics.averageWaitMinutes == null
              ? "—"
              : t("kpi.minutes", { mins: analytics.averageWaitMinutes })
          }
        />
        <Kpi
          label={t("kpi.savedHours")}
          value={
            analytics.savedHours > 0
              ? t("kpi.hoursValue", { hours: analytics.savedHours })
              : "—"
          }
          hint={
            analytics.warningPatientCount > 0
              ? t("kpi.warningHint", { count: analytics.warningPatientCount })
              : undefined
          }
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-1 text-sm font-semibold text-primary">{t("reliabilityTitle")}</h2>
          <p className="mb-4 text-xs text-muted">{t("reliabilityHint")}</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={28}
                  tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    background: "var(--color-surface, #fff)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name={t("series.completed")}
                  stroke="var(--color-accent, #0d9488)"
                  fill="var(--color-accent, #0d9488)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="noShow"
                  name={t("series.noShow")}
                  stroke="var(--color-danger, #dc2626)"
                  fill="var(--color-danger, #dc2626)"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-1 text-sm font-semibold text-primary">{t("busyHoursTitle")}</h2>
          <p className="mb-4 text-xs text-muted">{t("busyHoursHint")}</p>
          {peakData.length === 0 ? (
            <p className="rounded-xl border border-dashed border-subtle px-3 py-16 text-center text-sm text-muted">
              {ta("emptyChart")}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tick={{ fontSize: 10, fill: "currentColor", opacity: 0.45 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border, #e5e7eb)",
                      background: "var(--color-surface, #fff)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={ta("bookings")}
                    fill="var(--color-accent, #0d9488)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-subtle bg-surface p-5">
        <h2 className="mb-1 text-sm font-semibold text-primary">{t("popularServicesTitle")}</h2>
        <p className="mb-4 text-xs text-muted">{t("popularServicesHint")}</p>
        {analytics.topServices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-subtle px-3 py-10 text-center text-sm text-muted">
            {ta("emptyChart")}
          </p>
        ) : (
          <ul className="space-y-3">
            {analytics.topServices.map((service) => (
              <li key={service.name}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-primary">{service.name}</span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {t("serviceMeta", {
                      count: service.count,
                      amount: formatMoney(service.revenueEgp, locale),
                      currency: ta("currency"),
                    })}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.max(6, Math.round((service.count / maxService) * 100))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
