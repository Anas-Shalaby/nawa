"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Download, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import {
  InvoicePrint,
  type InvoicePrintData,
  type InvoicePrintHandle,
} from "@/components/InvoicePrint";
import type { FinancialOverview, FinancialTransaction } from "@/lib/dashboard/analyticsTypes";
import type { Locale } from "@/i18n/routing";

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

function AnimatedMoney({
  value,
  locale,
}: {
  value: number;
  locale: Locale;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
      maximumFractionDigits: 0,
    }).format(Math.round(latest)),
  );
  const [text, setText] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.1,
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

export function FinancialsShell({
  overview,
  clinicName,
  doctorName,
}: FinancialsShellProps) {
  const t = useTranslations("financials");
  const tInvoice = useTranslations("invoice");
  const locale = useLocale() as Locale;
  const [overviewState] = useState(overview);
  const [ledgerTab, setLedgerTab] = useState<"income" | "expense">("income");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<InvoicePrintData | null>(null);
  const invoiceRef = useRef<InvoicePrintHandle>(null);

  const ledgerRows =
    ledgerTab === "income"
      ? overviewState.recentTransactions
      : overviewState.recentExpenses;

  useEffect(() => {
    if (!pendingInvoice) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        await invoiceRef.current?.downloadPdf();
        if (!cancelled) toast.success(t("receiptDownloaded"));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "PDF failed");
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
    const isIncome = ledgerTab === "income";

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
      lineItems: [
        {
          description: tx.serviceName,
          quantity: 1,
          unitPrice: amount,
        },
      ],
      subtotal: amount,
      discount: 0,
      vat: 0,
      amountPaid: isIncome ? amount : 0,
      currency: t("currency"),
      qrValue: `NAWA|${tx.id}|${amount}`,
    });
  }

  return (
    <div className=" bg-base" dir="rtl" style={{ maxWidth: "100vw" }}>
      {pendingInvoice ? (
        <div
          aria-hidden
          className="pointer-events-none fixed -start-[9999px] top-0 w-[1024px]"
        >
          <InvoicePrint ref={invoiceRef} data={pendingInvoice} showActions={false} />
        </div>
      ) : null}

      <div className="mb-8 text-start">
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-5 text-start"
        >
          <p className="text-sm text-muted">{t("dailyRevenue")}</p>
          <p className="mt-3 text-3xl font-semibold text-accent-success">
            <AnimatedMoney value={overviewState.dailyRevenueEgp} locale={locale} />{" "}
            {t("currency")}
          </p>
        </motion.article>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-5 text-start"
        >
          <p className="text-sm text-muted">{t("monthlyRevenue")}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">
            <AnimatedMoney value={overviewState.monthlyRevenueEgp} locale={locale} />{" "}
            {t("currency")}
          </p>
          <p
            className={[
              "mt-2 inline-flex items-center gap-1 text-xs font-medium",
              overviewState.monthlyGrowthPct >= 0
                ? "text-accent-success"
                : "text-accent-danger",
            ].join(" ")}
          >
            {overviewState.monthlyGrowthPct >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {`${overviewState.monthlyGrowthPct >= 0 ? "+" : ""}${overviewState.monthlyGrowthPct}%`}
          </p>
        </motion.article>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-subtle bg-surface p-5 text-start"
        >
          <p className="text-sm text-muted">المصروفات</p>
          <p className="mt-3 text-3xl font-semibold text-accent-danger">
            <AnimatedMoney value={overviewState.monthlyExpensesEgp} locale={locale} />{" "}
            {t("currency")}
          </p>
          <p className="mt-2 text-xs text-muted">
            اليوم: {formatMoney(overviewState.dailyExpensesEgp, locale)} {t("currency")}
          </p>
        </motion.article>

        <motion.article
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-accent-danger bg-accent-danger/10 p-5 text-start"
        >
          <p className="text-sm text-muted">أموال متأخرة بالخارج</p>
          <motion.p
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
            className="mt-3 text-3xl font-semibold text-accent-danger"
          >
            <AnimatedMoney value={overviewState.outstandingDebtsEgp} locale={locale} />{" "}
            {t("currency")}
          </motion.p>
        </motion.article>
      </motion.div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold text-primary">إيرادات آخر 30 يوم</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewState.trendLast30Days}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8888A0", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(20,20,31,0.95)",
                    border: "1px solid rgba(42,42,60,1)",
                    borderRadius: 12,
                    color: "#F0F0F5",
                  }}
                  formatter={(value) => [
                    `${formatMoney(typeof value === "number" ? value : 0, locale)} ${t("currency")}`,
                    "الإيراد",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="incomeEgp"
                  stroke="#6C5CE7"
                  strokeWidth={2.5}
                  fill="url(#incomeFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-surface p-5">
          <h2 className="mb-3 text-base font-semibold text-primary">مرضى عليهم مستحقات</h2>
          <div className="max-h-72 space-y-2 overflow-y-auto pe-1">
            {overviewState.debtPatients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-subtle px-4 py-10 text-center text-sm text-muted">
                لا توجد مديونيات حالياً.
              </p>
            ) : (
              overviewState.debtPatients.map((patient) => {
                const url = buildWhatsAppActionUrl(patient.phoneNumber, "financial", {
                  patientName: patient.name,
                  amountDue: patient.amountDue,
                  locale,
                });
                return (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-subtle bg-base/40 px-3 py-2.5"
                  >
                    <div className="min-w-0 text-start">
                      <p className="truncate text-sm font-medium text-primary">{patient.name}</p>
                      <p className="text-xs font-semibold text-accent-danger">
                        {formatMoney(patient.amountDue, locale)} {t("currency")}
                      </p>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-subtle px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-elevated"
                    >
                      واتساب
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-subtle bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-subtle bg-base/40 p-1">
            <button
              type="button"
              onClick={() => setLedgerTab("income")}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                ledgerTab === "income"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-primary",
              ].join(" ")}
            >
              المقبوضات
            </button>
            <button
              type="button"
              onClick={() => setLedgerTab("expense")}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                ledgerTab === "expense"
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-primary",
              ].join(" ")}
            >
              المصروفات
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {ledgerRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-subtle px-4 py-12 text-center text-sm text-muted">
              لا توجد بيانات حتى الآن.
            </div>
          ) : (
            ledgerRows.map((tx, index) => (
              <motion.div
                key={`${ledgerTab}-${tx.id}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-[1fr_auto] items-center rounded-xl border border-subtle bg-base/30 px-3 py-3"
              >
                <div className="text-start">
                  <p className="text-sm font-medium text-primary">{tx.serviceName}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(tx.appointmentDate, locale)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{tx.patientName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={[
                      "text-sm font-semibold",
                      ledgerTab === "income"
                        ? "text-accent-success"
                        : "text-accent-danger",
                    ].join(" ")}
                  >
                    {ledgerTab === "income" ? "+" : "-"}
                    {formatMoney(tx.priceEgp, locale)} {t("currency")}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(tx)}
                    disabled={downloadingId === tx.id}
                    className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
                    aria-label={t("downloadReceipt")}
                    title={t("downloadReceipt")}
                  >
                    {downloadingId === tx.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
