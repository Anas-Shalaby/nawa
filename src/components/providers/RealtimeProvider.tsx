"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import {
  APPOINTMENT_SELECT,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import {
  playNotificationSound,
  unlockNotificationAudio,
} from "@/lib/notifications/playNotificationSound";
import { useNotifications } from "@/components/providers/NotificationsContext";

interface RealtimeProviderProps {
  tenantId: string;
  children: React.ReactNode;
}

export function RealtimeProvider({ tenantId, children }: RealtimeProviderProps) {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale();
  const { pushNotification } = useNotifications();

  useEffect(() => {
    const unlock = () => unlockNotificationAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`booking-notifications:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const row = payload.new as AppointmentJoinRow;
          if (!row?.id) return;

          const { data, error } = await supabase
            .from("appointments")
            .select(APPOINTMENT_SELECT)
            .eq("id", row.id)
            .eq("tenant_id", tenantId)
            .single();

          if (error || !data) return;

          const appointment = mapAppointmentRow(data as AppointmentJoinRow);
          const timeLabel = formatAppointmentTime(appointment.appointmentDate, locale);

          pushNotification({
            id: `booking-${appointment.id}`,
            kind: "booking",
            title: t("toastTitle"),
            body: t("toastDescription", {
              patient: appointment.patientName,
              service: appointment.serviceName,
              time: timeLabel,
            }),
            urgent: false,
            actionHref: `/dashboard/patients/${appointment.patientId}`,
            actionLabelKey: "viewDetails",
            meta: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              patientName: appointment.patientName,
              serviceName: appointment.serviceName,
              timeLabel,
            },
          });

          toast(t("toastTitle"), {
            description: t("toastDescription", {
              patient: appointment.patientName,
              service: appointment.serviceName,
              time: timeLabel,
            }),
            duration: 6000,
          });

          playNotificationSound();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, locale, pushNotification, t]);

  return children;
}
