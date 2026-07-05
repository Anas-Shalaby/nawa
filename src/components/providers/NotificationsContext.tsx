"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BookingNotification } from "@/lib/notifications/types";

const MAX_NOTIFICATIONS = 25;

interface NotificationsContextValue {
  notifications: BookingNotification[];
  unreadCount: number;
  pushNotification: (notification: Omit<BookingNotification, "read" | "createdAt">) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);

  const pushNotification = useCallback(
    (notification: Omit<BookingNotification, "read" | "createdAt">) => {
      setNotifications((current) => {
        if (current.some((item) => item.appointmentId === notification.appointmentId)) {
          return current;
        }

        const next: BookingNotification = {
          ...notification,
          read: false,
          createdAt: Date.now(),
        };

        return [next, ...current].slice(0, MAX_NOTIFICATIONS);
      });
    },
    [],
  );

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
      markAllRead,
    }),
    [notifications, unreadCount, pushNotification, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
