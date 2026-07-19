"use client";

import { useLocale, useTranslations } from "next-intl";
import { Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { usePermission } from "@/components/auth/PermissionProvider";
import type { Locale } from "@/i18n/routing";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";

interface BillingCardProps {
  balanceDue: number;
  payments: PatientPaymentRecord[];
  onOpenPayment: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatShortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

export function BillingCard({
  balanceDue,
  payments,
  onOpenPayment,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: BillingCardProps) {
  const t = useTranslations("ehr");
  const tw = useTranslations("ehr.workspace");
  const tv = useTranslations("ehr.workspace.visit");
  const locale = useLocale() as Locale;

  const canViewFinance = usePermission("finance.view");
  const canRecordPayment = usePermission("finance.record");

  if (!canViewFinance) return null;

  const recentPayments = payments.slice(0, 5);

  const summary = balanceDue > 0
    ? `${tv("step9")}: ${formatMoney(balanceDue, locale)} ${t("currency")}`
    : tw("billingClear");

  return (
    <section
      id="visit-billing"
      onClick={() => {
        if (isCollapsed) {
          onFocus();
        }
      }}
      className={[
        "rounded-2xl border bg-surface/40 p-5 transition-all duration-200 text-start",
        isActive
          ? "border-accent ring-1 ring-accent/20"
          : "border-subtle/70 hover:border-subtle",
        isCollapsed ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            9
          </span>
          <h2 className="text-sm font-semibold text-primary">{tv("step9")}</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="rounded-lg p-1 text-muted hover:bg-elevated hover:text-primary hide-on-print"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Card Body */}
      {!isCollapsed ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted">{tv("stepDescription9")}</p>
          
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                {t("statBalance")}
              </p>
            </div>
            <p
              className={[
                "text-2xl font-semibold tabular-nums tracking-tight",
                balanceDue > 0 ? "text-accent-danger" : "text-primary",
              ].join(" ")}
            >
              {formatMoney(balanceDue, locale)}{" "}
              <span className="text-sm font-medium text-muted">{t("currency")}</span>
            </p>
          </div>

          {/* Recent payments */}
          {recentPayments.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                {tw("recentPayments")}
              </p>
              <ul className="space-y-1.5">
                {recentPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-xs text-muted">
                      {formatShortDate(payment.paidAt, locale)}
                    </span>
                    <span className="font-medium tabular-nums text-accent-success">
                      +{formatMoney(payment.amountPaid, locale)} {t("currency")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Actions */}
          {balanceDue > 0 && canRecordPayment ? (
            <button
              type="button"
              onClick={onOpenPayment}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-semibold text-primary transition hover:border-accent/40 hide-on-print"
            >
              <Wallet className="h-3.5 w-3.5" aria-hidden />
              {t("addPayment")}
            </button>
          ) : balanceDue === 0 ? (
            <p className="mt-3 text-xs text-muted">{tw("billingClear")}</p>
          ) : null}
        </div>
      ) : (
        /* Collapsed Summary */
        <div className="mt-2.5 ps-8.5">
          <p className="text-xs text-primary/80 line-clamp-1 italic">
            {summary}
          </p>
        </div>
      )}
    </section>
  );
}
