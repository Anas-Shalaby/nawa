"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification } from "@/lib/notifications/types";

const MAX_NOTIFICATIONS = 40;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushNotification: (
    notification: Omit<AppNotification, "read" | "createdAt"> & {
      createdAt?: number;
      read?: boolean;
    },
  ) => void;
  hydrateNotifications: (items: AppNotification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const pushNotification = useCallback(
    (
      notification: Omit<AppNotification, "read" | "createdAt"> & {
        createdAt?: number;
        read?: boolean;
      },
    ) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }

        const appointmentId = notification.meta?.appointmentId;
        if (
          appointmentId &&
          current.some((item) => item.meta?.appointmentId === appointmentId)
        ) {
          return current;
        }

        const next: AppNotification = {
          ...notification,
          read: notification.read ?? false,
          createdAt: notification.createdAt ?? Date.now(),
        };

        return [next, ...current].slice(0, MAX_NOTIFICATIONS);
      });
    },
    [],
  );

  const hydrateNotifications = useCallback((items: AppNotification[]) => {
    if (items.length === 0) return;
    setNotifications((current) => {
      const existingIds = new Set(current.map((item) => item.id));
      const incoming = items.filter((item) => !existingIds.has(item.id));
      if (incoming.length === 0) return current;
      return [...incoming, ...current]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((item) => (item.read ? item : { ...item, read: true })),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      pushNotification,
      hydrateNotifications,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      pushNotification,
      hydrateNotifications,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
