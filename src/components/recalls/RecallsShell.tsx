"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { CalendarClock, UserRound } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { RecallPatient } from "@/lib/queries/recalls";
import { WhatsAppActionMenu } from "@/components/whatsapp/WhatsAppActionMenu";

interface RecallsShellProps {
  patients: RecallPatient[];
  recallMonths: number;
}

function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(isoDate));
}

export function RecallsShell({ patients, recallMonths }: RecallsShellProps) {
  const t = useTranslations("recalls");
  const locale = useLocale() as Locale;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="text-start">
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle", { months: recallMonths })}</p>
      </header>

      {patients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-subtle bg-surface/50 px-6 py-12 text-center"
        >
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-muted" aria-hidden />
          <p className="text-sm text-muted">{t("empty")}</p>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          {patients.map((patient, index) => (
            <motion.li
              key={patient.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="rounded-2xl border border-subtle bg-surface/50 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 text-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <UserRound className="h-5 w-5 text-accent" aria-hidden />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="font-semibold text-primary transition hover:text-accent"
                    >
                      {patient.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">{patient.phoneNumber}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("lastVisit", {
                        date: formatDate(patient.lastCompletedAt, locale),
                        months: patient.monthsSinceVisit,
                      })}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:max-w-[240px]">
                  <WhatsAppActionMenu
                    phoneNumber={patient.phoneNumber}
                    patientName={patient.name}
                    amountDue={patient.totalBalanceDue}
                    templates={["recall", "appointment", "financial"]}
                    variant="ghost"
                  />
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
