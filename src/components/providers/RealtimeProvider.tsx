"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { formatAppointmentTime } from "@/lib/datetime/cairo";
import {
  playNotificationSound,
  unlockNotificationAudio,
} from "@/lib/notifications/playNotificationSound";
import { useNotifications } from "@/components/providers/NotificationsContext";
import type { AppNotification } from "@/lib/notifications/types";

interface RealtimeProviderProps {
  tenantId: string;
  children: React.ReactNode;
}

export function RealtimeProvider({ tenantId, children }: RealtimeProviderProps) {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale();
  const { pushNotification, hydrateNotifications } = useNotifications();

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

    // Fetch initial unread notifications
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_read", false);

      if (!error && data) {
        const initialNotifications: AppNotification[] = data.map((row) => {
          let title = row.title;
          let body = row.body;
          const meta = row.meta as AppNotification["meta"] || {};
          
          if (row.kind === "booking" && meta.patientName && meta.serviceName && meta.appointmentDateIso) {
            const timeLabel = formatAppointmentTime(new Date(meta.appointmentDateIso), locale);
            title = t("toastTitle");
            body = t("toastDescription", {
              patient: meta.patientName,
              service: meta.serviceName,
              time: timeLabel,
            });
            meta.timeLabel = timeLabel;
          }

          return {
            id: row.id,
            kind: row.kind as AppNotification["kind"],
            title,
            body,
            urgent: row.urgent,
            actionHref: row.action_href,
            actionLabelKey: row.action_label_key as AppNotification["actionLabelKey"],
            meta,
            read: row.is_read,
            createdAt: new Date(row.created_at).getTime(),
          };
        });
        hydrateNotifications(initialNotifications);
      }
    };
    
    void fetchInitial();

    // Listen for new notifications
    const channel = supabase
      .channel(`app-notifications:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_notifications",
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          // RLS is enforced at the database, but postgres_changes might deliver to all subscribers 
          // if not careful, though the user still needs to filter. Wait, realtime does not apply RLS to `filter` unless we use user-specific channels or row-level auth for realtime.
          // BUT since we fetch auth.uid() in the listener, actually the payload contains `user_id`.
          // We must check if `user_id` matches current user.
          const { data: userData } = await supabase.auth.getUser();
          if (payload.new.user_id !== userData.user?.id) return;

          const row = payload.new;
          let title = row.title;
          let body = row.body;
          const meta = row.meta as AppNotification["meta"] || {};

          if (row.kind === "booking" && meta.patientName && meta.serviceName && meta.appointmentDateIso) {
            const timeLabel = formatAppointmentTime(new Date(meta.appointmentDateIso), locale);
            title = t("toastTitle");
            body = t("toastDescription", {
              patient: meta.patientName,
              service: meta.serviceName,
              time: timeLabel,
            });
            meta.timeLabel = timeLabel;
          }

          pushNotification({
            id: row.id,
            kind: row.kind as AppNotification["kind"],
            title,
            body,
            urgent: row.urgent,
            actionHref: row.action_href,
            actionLabelKey: row.action_label_key as AppNotification["actionLabelKey"],
            meta,
          });

          toast(title, {
            description: body,
            duration: 6000,
          });

          playNotificationSound();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, locale, pushNotification, hydrateNotifications, t]);

  return children;
}
