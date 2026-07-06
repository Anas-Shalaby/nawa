"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  APPOINTMENT_SELECT,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { isAppointmentOnCairoDate } from "@/lib/datetime/cairo";
import { isQueueVisible, type Appointment } from "@/lib/dashboard/types";

interface UseAppointmentsRealtimeOptions {
  tenantId: string;
  onUpsert: (appointment: Appointment) => void;
  onRemove: (appointmentId: string) => void;
}

export function useAppointmentsRealtime({
  tenantId,
  onUpsert,
  onRemove,
}: UseAppointmentsRealtimeOptions) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`appointments:tenant:${tenantId}`)
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
            if (oldRow.id) onRemove(oldRow.id);
            return;
          }

          const row = payload.new as AppointmentJoinRow;
          if (!row?.id) return;

          if (row.status === "no_show" || row.status === "canceled") {
            onRemove(row.id);
            return;
          }

          if (!isQueueVisible(row.status)) {
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
            onRemove(row.id);
            return;
          }

          onUpsert(appointment);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, onUpsert, onRemove]);
}
