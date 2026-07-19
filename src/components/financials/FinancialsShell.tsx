"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { Download, Loader2, MessageCircle, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";
import { Can } from "@/components/auth/Can";
import { Link } from "@/i18n/navigation";
import {
  InvoicePrint,
  type InvoicePrintData,
  type InvoicePrintHandle,
} from "@/components/InvoicePrint";
import type { FinancialOverview, FinancialTransaction } from "@/lib/dashboard/analyticsTypes";
import type { Locale } from "@/i18n/routing";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";

type Period = "today" | "week" | "month";

interface FinancialsShellProps {
  overview: FinancialOverview;
  clinicName: string;
  doctorName: string;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

function buildInvoiceNumber(tx: FinancialTransaction, year: number): string {
  const short = tx.id.replaceAll("-", "").slice(0, 6).toUpperCase();
  return `#INV-${year}-${short}`;
}

function AnimatedMoney({ value, locale }: { value: number; locale: Locale }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      maximumFractionDigits: 0,
    }).format(Math.round(latest)),
  );
  const [text, setText] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.9,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", (latest) => setText(latest));
    return () => {
      controls.stop();
      unsub();
    };
  }, [count, rounded, value]);

  return <>{text}</>;
}

function KpiCard({
  label,
  value,
  locale,
  currency,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  locale: Locale;
  currency: string;
  hint?: string;
  tone?: "default" | "accent" | "danger";
}) {
  const valueClass =
    tone === "danger"
      ? "text-accent-danger"
      : tone === "accent"
        ? "text-accent"
        : "text-primary";

  return (
    <article className="rounded-2xl border border-subtle bg-surface p-5 text-start">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        <AnimatedMoney value={value} locale={locale} /> {currency}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </article>
  );
}

export function FinancialsShell({
  overview,
  clinicName,
  doctorName,
}: FinancialsShellProps) {
  const t = useTranslations("financials");
  const tInvoice = useTranslations("invoice");
  const locale = useLocale() as Locale;
  const [period, setPeriod] = useState<Period>("today");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<InvoicePrintData | null>(null);
  const invoiceRef = useRef<InvoicePrintHandle>(null);

  const earned = useMemo(() => {
    if (period === "week") return overview.weeklyRevenueEgp;
    if (period === "month") return overview.monthlyRevenueEgp;
    return overview.dailyRevenueEgp;
  }, [overview, period]);

  const collections = useMemo(() => {
    if (period === "week") return overview.collectionsWeekEgp;
    if (period === "month") return overview.collectionsMonthEgp;
    return overview.collectionsTodayEgp;
  }, [overview, period]);

  const noShowLoss =
    period === "today" ? overview.dailyExpensesEgp : overview.monthlyExpensesEgp;

  const maxService = overview.topServices[0]?.revenueEgp ?? 1;

  useEffect(() => {
    if (!pendingInvoice) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        await invoiceRef.current?.downloadPdf();
        if (!cancelled) toast.success(t("receiptDownloaded"));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : t("pdfFailed"));
        }
      } finally {
        if (!cancelled) {
          setPendingInvoice(null);
          setDownloadingId(null);
        }
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingInvoice, t]);

  function handleDownloadReceipt(tx: FinancialTransaction) {
    if (downloadingId) return;
    setDownloadingId(tx.id);
    const year = new Date(tx.appointmentDate).getFullYear() || new Date().getFullYear();
    const amount = Math.max(0, tx.priceEgp);
    setPendingInvoice({
      invoiceNumber: buildInvoiceNumber(tx, year),
      dateLabel: formatDate(tx.appointmentDate, locale),
      clinicName,
      clinicLogoUrl: "/icons/icon-192.png",
      patientName: tx.patientName,
      patientPhone: "—",
      patientId: tx.id.slice(0, 8).toUpperCase(),
      doctorName,
      department: tInvoice("defaultDepartment"),
      lineItems: [{ description: tx.serviceName, quantity: 1, unitPrice: amount }],
      subtotal: amount,
      discount: 0,
      vat: 0,
      amountPaid: amount,
      currency: t("currency"),
      qrValue: `NAWAH|${tx.id}|${amount}`,
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      {pendingInvoice ? (
        <div
          aria-hidden
          className="pointer-events-none fixed -start-[9999px] top-0 w-[1024px]"
        >
          <InvoicePrint ref={invoiceRef} data={pendingInvoice} showActions={false} />
        </div>
      ) : null}

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
          aria-label={t("periodLabel")}
        >
          {(["today", "week", "month"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={period === item}
              onClick={() => setPeriod(item)}
              className={[
                "rounded-lg px-3 py-2 text-xs font-semibold transition",
                period === item
                  ? "bg-accent text-white"
                  : "text-muted hover:text-primary",
              ].join(" ")}
            >
              {t(`period.${item}`)}
            </button>
          ))}
        </div>
      </header>

      <section
        aria-label={t("kpis")}
        className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        <KpiCard
          label={t("kpi.earned")}
          value={earned}
          locale={locale}
          currency={t("currency")}
          hint={
            period === "month"
              ? `${overview.monthlyGrowthPct >= 0 ? "+" : ""}${overview.monthlyGrowthPct}% ${t("vsLastMonth")}`
              : undefined
          }
          tone="accent"
        />
        <KpiCard
          label={t("kpi.outstanding")}
          value={overview.outstandingDebtsEgp}
          locale={locale}
          currency={t("currency")}
          hint={t("debtorsCount", { count: overview.debtPatients.length })}
          tone={overview.outstandingDebtsEgp > 0 ? "danger" : "default"}
        />
        <KpiCard
          label={t("kpi.collections")}
          value={collections}
          locale={locale}
          currency={t("currency")}
        />
        <KpiCard
          label={t("kpi.aov")}
          value={overview.averageVisitValueEgp}
          locale={locale}
          currency={t("currency")}
          hint={t("visitsMonth", { count: overview.completedVisitsMonth })}
        />
      </section>

      {noShowLoss > 0 ? (
        <p className="mb-6 text-sm text-muted">
          {t("noShowLoss", {
            amount: formatMoney(noShowLoss, locale),
            currency: t("currency"),
            scope: t(period === "today" ? "period.today" : "period.month"),
          })}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-primary">{t("trendTitle")}</h2>
            <span
              className={[
                "inline-flex items-center gap-1 text-xs font-medium",
                overview.monthlyGrowthPct >= 0
                  ? "text-accent"
                  : "text-accent-danger",
              ].join(" ")}
            >
              {overview.monthlyGrowthPct >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {overview.monthlyGrowthPct}%
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.trendLast30Days}>
                <defs>
                  <linearGradient id="incomeFillCalm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent, #0d9488)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-accent, #0d9488)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "currentColor", fontSize: 11, opacity: 0.45 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface, #fff)",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 12,
                  }}
                  formatter={(value) => [
                    `${formatMoney(typeof value === "number" ? value : 0, locale)} ${t("currency")}`,
                    t("trendTooltip"),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="incomeEgp"
                  stroke="var(--color-accent, #0d9488)"
                  strokeWidth={2}
                  fill="url(#incomeFillCalm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-primary">{t("topServices")}</h2>
          {overview.topServices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-subtle px-3 py-10 text-center text-sm text-muted">
              {t("empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {overview.topServices.map((service) => (
                <li key={service.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-primary">{service.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {formatMoney(service.revenueEgp, locale)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${Math.max(6, Math.round((service.revenueEgp / maxService) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {t("serviceVisits", { count: service.count })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t("outstandingTitle")}</h2>
          <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
            {overview.debtPatients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-subtle px-4 py-10 text-center text-sm text-muted">
                {t("outstandingEmpty")}
              </p>
            ) : (
              overview.debtPatients.map((patient) => {
                const url = buildWhatsAppActionUrl(patient.phoneNumber, "financial", {
                  patientName: patient.name,
                  amountDue: patient.amountDue,
                  locale,
                });
                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-subtle px-3 py-2.5"
                  >
                    <div className="min-w-0 text-start">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="truncate text-sm font-medium text-primary hover:text-accent"
                      >
                        {patient.name}
                      </Link>
                      <p className="text-xs font-semibold tabular-nums text-accent-danger">
                        {formatMoney(patient.amountDue, locale)} {t("currency")}
                      </p>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-subtle px-2.5 py-1.5 text-xs font-medium text-primary transition hover:border-accent/40"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {t("whatsapp")}
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t("recentPayments")}</h2>
          <div className="max-h-80 space-y-2 overflow-y-auto pe-1">
            {overview.recentPayments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-subtle px-4 py-10 text-center text-sm text-muted">
                {t("paymentsEmpty")}
              </p>
            ) : (
              overview.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-subtle px-3 py-2.5"
                >
                  <div className="min-w-0 text-start">
                    <Link
                      href={`/dashboard/patients/${payment.patientId}`}
                      className="truncate text-sm font-medium text-primary hover:text-accent"
                    >
                      {payment.patientName}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {formatDate(payment.paidAt, locale)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                    +{formatMoney(payment.amountPaid, locale)} {t("currency")}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t("topPatients")}</h2>
          {overview.topPatientsByRevenue.length === 0 ? (
            <p className="text-sm text-muted">{t("empty")}</p>
          ) : (
            <ol className="space-y-2">
              {overview.topPatientsByRevenue.map((patient, index) => (
                <li
                  key={patient.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-primary">
                    <span className="me-2 text-muted">{index + 1}.</span>
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="hover:text-accent"
                    >
                      {patient.name}
                    </Link>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {formatMoney(patient.revenueEgp, locale)} {t("currency")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t("recentVisits")}</h2>
          <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
            {overview.recentTransactions.length === 0 ? (
              <p className="text-sm text-muted">{t("empty")}</p>
            ) : (
              overview.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-subtle px-3 py-2.5"
                >
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-medium text-primary">
                      {tx.serviceName}
                    </p>
                    <p className="text-[11px] text-muted">
                      {tx.patientName} · {formatDate(tx.appointmentDate, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular-nums text-primary">
                      {formatMoney(tx.priceEgp, locale)}
                    </p>
                    <Can permission="finance.view">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceipt(tx)}
                        disabled={downloadingId === tx.id}
                        className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                        aria-label={t("downloadReceipt")}
                      >
                        {downloadingId === tx.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>
                    </Can>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
