"use client";

import { NotificationsProvider } from "@/components/providers/NotificationsContext";
import { NotificationToaster } from "@/components/providers/NotificationToaster";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

interface DashboardNotificationsRootProps {
  tenantId: string;
  children: React.ReactNode;
}

export function DashboardNotificationsRoot({
  tenantId,
  children,
}: DashboardNotificationsRootProps) {
  return (
    <NotificationsProvider>
      <RealtimeProvider tenantId={tenantId}>
        {children}
        <NotificationToaster />
      </RealtimeProvider>
    </NotificationsProvider>
  );
}
