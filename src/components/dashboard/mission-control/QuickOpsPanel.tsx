"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addWalkIn } from "@/actions/addWalkIn";
import {
  createPatientBookingSchema,
  type PatientBookingFormValues,
} from "@/lib/booking/schema";
import type {
  AttentionItem,
  DashboardService,
  UnpaidCollectItem,
} from "@/lib/dashboard/types";
import { Link } from "@/i18n/navigation";
import { PatientQuickSearch } from "./PatientQuickSearch";
import { OperationsCommandList } from "./OperationsCommandList";
import { AttentionCenter } from "./AttentionCenter";

interface QuickOpsPanelProps {
  clinicName: string;
  dateLabel: string;
  services: DashboardService[];
  canViewRevenue: boolean;
  canCreateWalkIn: boolean;
  canManageQueue: boolean;
  pendingTomorrowCount: number;
  yesterdayUnpaid: UnpaidCollectItem[];
  attentionItems: AttentionItem[];
  unreadCount: number;
  onWalkInAdded: (appointment: import("@/lib/dashboard/types").Appointment) => void;
}

export function QuickOpsPanel({
  clinicName,
  dateLabel,
  services,
  canViewRevenue,
  canCreateWalkIn,
  canManageQueue,
  pendingTomorrowCount,
  yesterdayUnpaid,
  attentionItems,
  unreadCount,
  onWalkInAdded,
}: QuickOpsPanelProps) {
  const t = useTranslations("dashboard.commandCenter");
  const tv = useTranslations("validation");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInPending, startWalkIn] = useTransition();
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");

  const schema = useMemo(() => createPatientBookingSchema((key) => tv(key)), [tv]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", whatsapp: "" },
  });

  function onWalkIn(values: PatientBookingFormValues) {
    if (!canCreateWalkIn) return;
    if (!serviceId) {
      setWalkInError(t("ops.serviceRequired"));
      return;
    }
    setWalkInError(null);
    startWalkIn(async () => {
      const result = await addWalkIn({
        name: values.name,
        whatsapp: values.whatsapp,
        serviceId,
      });
      if (!result.success || !result.appointment) {
        setWalkInError(result.error ?? t("ops.walkInError"));
        return;
      }
      onWalkInAdded(result.appointment);
      reset({ name: "", whatsapp: "" });
      setShowWalkIn(false);
      toast.success(t("ops.walkInSuccess"));
    });
  }

  const unpaidCount = canViewRevenue ? yesterdayUnpaid.length : 0;

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-subtle bg-surface p-3 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
      <div className="shrink-0">
        <p className="text-[11px] font-medium text-muted">{clinicName}</p>
        <h1 className="text-sm font-semibold text-primary">{t("title")}</h1>
        <p className="text-[10px] text-muted">{dateLabel}</p>
      </div>

      <PatientQuickSearch disabled={!canManageQueue} />

      <OperationsCommandList
        pendingTomorrowCount={pendingTomorrowCount}
        unpaidCount={unpaidCount}
        unreadCount={unreadCount}
        canViewRevenue={canViewRevenue}
        canManageQueue={canManageQueue}
        onWalkInClick={() => setShowWalkIn((value) => !value)}
      />

      {showWalkIn ? (
        <section className="rounded-xl border border-subtle bg-elevated/60 p-3">
          <h2 className="mb-2 text-xs font-semibold text-primary">{t("ops.walkInTitle")}</h2>
          <form className="space-y-2" onSubmit={handleSubmit(onWalkIn)}>
            <div>
              <label htmlFor="mc-walkin-name" className="sr-only">
                {t("ops.name")}
              </label>
              <input
                id="mc-walkin-name"
                {...register("name")}
                placeholder={t("ops.name")}
                className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              />
              {errors.name ? (
                <p className="text-[10px] text-accent-danger">{errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="mc-walkin-phone" className="sr-only">
                {t("ops.phone")}
              </label>
              <input
                id="mc-walkin-phone"
                {...register("whatsapp")}
                placeholder={t("ops.phone")}
                dir="ltr"
                className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-start text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              />
              {errors.whatsapp ? (
                <p className="text-[10px] text-accent-danger">{errors.whatsapp.message}</p>
              ) : null}
            </div>
            <label htmlFor="mc-walkin-service" className="sr-only">
              Service
            </label>
            <select
              id="mc-walkin-service"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-xs text-primary focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {walkInError ? (
              <p className="text-[10px] text-accent-danger">{walkInError}</p>
            ) : null}
            <button
              type="submit"
              disabled={walkInPending || services.length === 0 || !canCreateWalkIn}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
            >
              {walkInPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              {t("ops.addToQueue")}
            </button>
          </form>
        </section>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-subtle bg-elevated/40 p-3">
        <h2 className="mb-2 shrink-0 text-xs font-semibold text-primary">
          {t("ops.urgentTitle")}
        </h2>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
          <AttentionCenter items={attentionItems} compact />

          {canViewRevenue &&
            yesterdayUnpaid.map((patient) => (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="block rounded-lg border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-2 text-[11px] text-primary transition hover:border-accent-danger/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-danger/30"
              >
                <span className="font-semibold text-accent-danger">
                  {t("ops.collectYesterday", {
                    name: patient.name,
                    amount: patient.amountDue.toLocaleString(),
                  })}
                </span>
              </Link>
            ))}

          {attentionItems.length === 0 &&
          unpaidCount === 0 &&
          pendingTomorrowCount === 0 ? (
            <p className="rounded-lg border border-dashed border-subtle px-2 py-6 text-center text-[11px] text-muted">
              {t("ops.noUrgent")}
            </p>
          ) : null}
        </div>
      </section>
    </aside>
  );
}
