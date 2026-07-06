"use client";

import { useCallback, useState } from "react";
import { isAppointmentOnCairoDate } from "@/lib/datetime/cairo";
import type { DailyMiniStats } from "@/lib/dashboard/miniStats";
import type {
  Appointment,
  DashboardService,
} from "@/lib/dashboard/types";
import { DailyMiniStatsBar } from "./DailyMiniStatsBar";
import { DashboardHeader } from "./DashboardHeader";
import { WalkInModal } from "./WalkInModal";
import { BlockTimeModal } from "./BlockTimeModal";
import { SmartQueueBoard } from "./SmartQueueBoard";

interface DashboardShellProps {
  clinicName: string;
  date: string;
  tenantId: string;
  initialAppointments: Appointment[];
  initialMiniStats: DailyMiniStats;
  canViewRevenue: boolean;
  services: DashboardService[];
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
  const [appointments, setAppointments] = useState(initialAppointments);

  const handleRealtimeUpsert = useCallback((appointment: Appointment) => {
    if (!isAppointmentOnCairoDate(appointment.appointmentDate)) {
      return;
    }

    setAppointments((prev) => {
      const exists = prev.some((item) => item.id === appointment.id);
      if (exists) {
        return prev.map((item) => (item.id === appointment.id ? appointment : item));
      }
      return [...prev, appointment].sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      );
    });
  }, []);

  const handleRealtimeRemove = useCallback((appointmentId: string) => {
    setAppointments((prev) => prev.filter((item) => item.id !== appointmentId));
  }, []);

  const handleWalkInSuccess = useCallback(
    (appointment: Appointment) => {
      handleRealtimeUpsert(appointment);
    },
    [handleRealtimeUpsert],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <DailyMiniStatsBar
        appointments={appointments}
        initialStats={initialMiniStats}
        canViewRevenue={canViewRevenue}
      />

      <div className="mb-4 flex shrink-0 flex-col gap-4 rounded-2xl border border-subtle/40 bg-surface/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <DashboardHeader clinicName={clinicName} date={date} />
        <div className="flex flex-wrap items-center gap-2">
          <BlockTimeModal tenantId={tenantId} />
          <WalkInModal services={services} onSuccess={handleWalkInSuccess} />
        </div>
      </div>

      <div className="min-h-0 flex-1 w-full">
        <SmartQueueBoard
          appointments={appointments}
          tenantId={tenantId}
          services={services}
          onAppointmentsChange={setAppointments}
          onNoShowMarked={() => undefined}
          onRealtimeUpsert={handleRealtimeUpsert}
          onRealtimeRemove={handleRealtimeRemove}
        />
      </div>
    </div>
  );
}
