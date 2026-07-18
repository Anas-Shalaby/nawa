"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  APPOINTMENT_SELECT,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { isAppointmentOnCairoDate } from "@/lib/datetime/cairo";
import type { Appointment, StaffAvailability } from "@/lib/dashboard/types";
import { normalizeTeamRole } from "@/lib/team/teamOpsSelectors";
import type { TeamStaffBase } from "@/lib/team/types";

interface UseTeamOpsRealtimeOptions {
  tenantId: string;
  onAppointmentUpsert: (appointment: Appointment) => void;
  onAppointmentRemove: (appointmentId: string) => void;
  onStaffUpsert: (staff: TeamStaffBase) => void;
  onStaffRemove: (staffId: string) => void;
}

export function useTeamOpsRealtime({
  tenantId,
  onAppointmentUpsert,
  onAppointmentRemove,
  onStaffUpsert,
  onStaffRemove,
}: UseTeamOpsRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`team-ops:tenant:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow.id) onAppointmentRemove(oldRow.id);
            return;
          }

          const row = payload.new as AppointmentJoinRow;
          if (!row?.id) return;

          if (row.status === "no_show" || row.status === "canceled") {
            onAppointmentRemove(row.id);
            return;
          }

          const { data, error } = await supabase
            .from("appointments")
            .select(APPOINTMENT_SELECT)
            .eq("id", row.id)
            .single();

          if (error || !data) return;

          const appointment = mapAppointmentRow(data as AppointmentJoinRow);
          if (!isAppointmentOnCairoDate(appointment.appointmentDate)) {
            onAppointmentRemove(row.id);
            return;
          }

          onAppointmentUpsert(appointment);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_profiles",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (oldRow.id) onStaffRemove(oldRow.id);
            return;
          }

          const row = payload.new as {
            id: string;
            display_name: string;
            role: string;
            availability: StaffAvailability;
            status_changed_at: string;
            avg_consult_minutes: number;
            department?: string | null;
            phone?: string | null;
            email?: string | null;
            user_id?: string | null;
            is_suspended?: boolean | null;
            leave_until?: string | null;
            rating_avg?: number | null;
          };

          if (!row?.id) return;

          onStaffUpsert({
            id: row.id,
            displayName: row.display_name,
            role: normalizeTeamRole(row.role),
            department: row.department ?? null,
            phone: row.phone ?? null,
            email: row.email ?? null,
            userId: row.user_id ?? null,
            isSuspended: Boolean(row.is_suspended),
            availability: row.availability,
            statusChangedAt: row.status_changed_at,
            avgConsultMinutes: row.avg_consult_minutes,
            leaveUntil: row.leave_until ?? null,
            ratingAvg: row.rating_avg ?? null,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    tenantId,
    onAppointmentUpsert,
    onAppointmentRemove,
    onStaffUpsert,
    onStaffRemove,
  ]);
}
