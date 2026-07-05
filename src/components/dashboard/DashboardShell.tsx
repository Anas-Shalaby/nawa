"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type {
  Appointment,
  DashboardService,
} from "@/lib/dashboard/types";
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { isQueueVisible } from "@/lib/dashboard/types";
import { AnalyticsKpiBar } from "./AnalyticsKpiBar";
import { DashboardHeader } from "./DashboardHeader";
import { WalkInModal } from "./WalkInModal";
import { SmartQueueBoard } from "./SmartQueueBoard";

interface DashboardShellProps {
  clinicName: string;
  date: string;
  tenantId: string;
  initialAppointments: Appointment[];
  services: DashboardService[];
  analytics: DashboardAnalytics;
}

export function DashboardShell({
  clinicName,
  date,
  tenantId,
  initialAppointments,
  services,
  analytics,
}: DashboardShellProps) {
  const [appointments, setAppointments] = useState(initialAppointments);

  const visibleCount = appointments.filter((a) => isQueueVisible(a.status)).length;

  const handleRealtimeUpsert = useCallback((appointment: Appointment) => {
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

  const handleNoShowMarked = useCallback(() => {
    // Analytics refresh on next navigation; queue removes row optimistically.
  }, []);

  const handleWalkInSuccess = useCallback((appointment: Appointment) => {
    handleRealtimeUpsert(appointment);
  }, [handleRealtimeUpsert]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DashboardHeader
          clinicName={clinicName}
          date={date}
          appointmentCount={visibleCount}
        />
        <WalkInModal services={services} onSuccess={handleWalkInSuccess} />
      </div>

      <AnalyticsKpiBar analytics={analytics} />

      <SmartQueueBoard
        appointments={appointments}
        tenantId={tenantId}
        services={services}
        onAppointmentsChange={setAppointments}
        onNoShowMarked={handleNoShowMarked}
        onRealtimeUpsert={handleRealtimeUpsert}
        onRealtimeRemove={handleRealtimeRemove}
      />
    </>
  );
}
