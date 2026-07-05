"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Banknote, Receipt } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";
import { WhatsAppActionMenu } from "@/components/whatsapp/WhatsAppActionMenu";
import { RecordPaymentModal } from "./RecordPaymentModal";

interface PatientFinancialCardProps {
  patientId: string;
  patientName: string;
  phoneNumber: string;
  initialBalanceDue: number;
  initialPayments: PatientPaymentRecord[];
}

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function PatientFinancialCard({
  patientId,
  patientName,
  phoneNumber,
  initialBalanceDue,
  initialPayments,
}: PatientFinancialCardProps) {
  const t = useTranslations("financial");
  const locale = useLocale() as Locale;
  const [balanceDue, setBalanceDue] = useState(initialBalanceDue);
  const [payments, setPayments] = useState(initialPayments);
  const [modalOpen, setModalOpen] = useState(false);

  const hasDebt = balanceDue > 0;

  function handleRecorded(newBalance: number, amountPaid: number) {
    setBalanceDue(newBalance);
    setPayments((prev) => [
      {
        id: crypto.randomUUID(),
        amountPaid,
        paidAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={[
          "flex flex-col rounded-2xl border p-5",
          hasDebt
            ? "border-rose-500/25 bg-rose-500/5"
            : "border-subtle bg-surface/50",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center gap-2 text-start">
          <div
            className={[
              "flex h-9 w-9 items-center justify-center rounded-xl",
              hasDebt ? "bg-rose-500/15" : "bg-accent/15",
            ].join(" ")}
          >
            <Banknote
              className={[
                "h-4 w-4",
                hasDebt ? "text-rose-400" : "text-accent",
              ].join(" ")}
              aria-hidden
            />
          </div>
          <h2 className="text-sm font-semibold text-primary">{t("ledgerTitle")}</h2>
        </div>

        <div className="mb-5 text-start">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("totalBalanceDue")}
          </p>
          <p
            className={[
              "mt-1 text-3xl font-bold tabular-nums",
              hasDebt ? "text-rose-400" : "text-primary",
            ].join(" ")}
          >
            {formatMoney(balanceDue, locale)}
            <span className="ms-1.5 text-base font-medium text-muted">
              {t("currency")}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={balanceDue <= 0}
          className={[
            "mb-4 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition",
            hasDebt
              ? "bg-rose-500/20 text-rose-100 hover:bg-rose-500/30"
              : "border border-subtle text-muted",
            "disabled:cursor-not-allowed disabled:opacity-50",
          ].join(" ")}
        >
          {t("recordPayment")}
        </button>

        {hasDebt && (
          <div className="mb-4">
            <WhatsAppActionMenu
              phoneNumber={phoneNumber}
              patientName={patientName}
              amountDue={balanceDue}
              templates={["financial"]}
            />
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-auto border-t border-subtle pt-4 text-start">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <Receipt className="h-3.5 w-3.5" aria-hidden />
              {t("recentPayments")}
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {payments.slice(0, 8).map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-base/40 px-3 py-2 text-sm"
                >
                  <span className="text-muted">
                    {formatDate(payment.paidAt, locale)}
                  </span>
                  <span className="font-medium tabular-nums text-primary">
                    −{formatMoney(payment.amountPaid, locale)} {t("currency")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.aside>

      <RecordPaymentModal
        open={modalOpen}
        patientId={patientId}
        balanceDue={balanceDue}
        onClose={() => setModalOpen(false)}
        onRecorded={(newBalance) => {
          const paid = balanceDue - newBalance;
          handleRecorded(newBalance, paid);
        }}
      />
    </>
  );
}
