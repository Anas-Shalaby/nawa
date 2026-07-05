"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus } from "lucide-react";
import type { DashboardService } from "@/lib/dashboard/types";
import { ScheduleSessionModal } from "./ScheduleSessionModal";

interface ScheduleSessionButtonProps {
  patientId: string;
  patientName: string;
  defaultServiceId?: string;
  services: DashboardService[];
  tenantId: string;
  onScheduled?: () => void;
}

export function ScheduleSessionButton({
  patientId,
  patientName,
  defaultServiceId,
  services,
  tenantId,
  onScheduled,
}: ScheduleSessionButtonProps) {
  const t = useTranslations("dashboard.schedule");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={services.length === 0}
        className={[
          "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30",
          "bg-accent/10 px-4 py-3 text-sm font-medium text-accent transition",
          "hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        <CalendarPlus className="h-5 w-5 shrink-0" aria-hidden />
        {t("trigger")}
      </button>

      <ScheduleSessionModal
        open={open}
        patientId={patientId}
        patientName={patientName}
        defaultServiceId={defaultServiceId}
        services={services}
        tenantId={tenantId}
        onClose={() => setOpen(false)}
        onScheduled={() => {
          setOpen(false);
          onScheduled?.();
        }}
      />
    </>
  );
}
