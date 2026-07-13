"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Inbox, X } from "lucide-react";
import { fetchOperationalNotificationAlerts } from "@/actions/fetchOperationalNotificationAlerts";
import { useNotifications } from "@/components/providers/NotificationsContext";
import { NotificationItem } from "@/components/dashboard/NotificationItem";
import type { AppNotification } from "@/lib/notifications/types";
import { Link } from "@/i18n/navigation";

type FilterTab = "all" | "unread" | "urgent";

export function NotificationCenter() {
  const t = useTranslations("dashboard.notifications");
  const { notifications, unreadCount, markAllRead, pushNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [hydratedOps, setHydratedOps] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hydratedOps) return;
    let cancelled = false;

    void (async () => {
      try {
        const alerts = await fetchOperationalNotificationAlerts();
        if (cancelled) return;
        for (const alert of alerts) {
          pushNotification({
            id: alert.id,
            kind: "inventory",
            title: alert.outOfStock
              ? t("inventoryOutTitle")
              : t("inventoryLowTitle"),
            body: alert.outOfStock
              ? t("inventoryOutBody", { name: alert.name })
              : t("inventoryLowBody", {
                  name: alert.name,
                  quantity: alert.quantity,
                  min: alert.minThreshold,
                }),
            urgent: alert.urgent,
            actionHref: "/dashboard/inventory",
            actionLabelKey: "updateStock",
            meta: {
              inventoryItemId: alert.itemId,
              inventoryName: alert.name,
              inventoryQuantity: alert.quantity,
              inventoryMinThreshold: alert.minThreshold,
            },
          });
        }
      } finally {
        if (!cancelled) setHydratedOps(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydratedOps, pushNotification, t]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread") return !item.read;
      if (filter === "urgent") return Boolean(item.urgent) || item.kind === "urgent";
      return true;
    });
  }, [notifications, filter]);

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: t("filters.all") },
    { id: "unread", label: t("filters.unread") },
    { id: "urgent", label: t("filters.urgent") },
  ];

  const drawer =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              key="notification-backdrop"
              type="button"
              aria-label={t("close")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-base/70 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            <motion.aside
              key="notification-drawer"
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label={t("centerTitle")}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className={[
                "fixed inset-y-0 end-0 z-[210] flex h-dvh w-[min(100vw,24rem)] flex-col",
                "border-s border-subtle bg-surface shadow-[0_0_60px_rgba(0,0,0,0.45)]",
              ].join(" ")}
            >
              <header className="shrink-0 border-b border-subtle px-4 pb-3 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-primary">
                    {t("centerTitle")}
                  </h2>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 ? (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:text-accent"
                      >
                        {t("markAllRead")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
                      aria-label={t("close")}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tabs.map((tab) => {
                    const active = filter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFilter(tab.id)}
                        className={[
                          "rounded-full px-3 py-1 text-[11px] font-medium transition",
                          active
                            ? "bg-accent text-white"
                            : "bg-elevated text-muted hover:text-primary",
                        ].join(" ")}
                      >
                        {tab.label}
                        {tab.id === "unread" && unreadCount > 0
                          ? ` · ${unreadCount}`
                          : ""}
                      </button>
                    );
                  })}
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {filtered.length === 0 ? (
                  <EmptyState
                    message={
                      filter === "all"
                        ? t("emptyCalm")
                        : filter === "unread"
                          ? t("emptyUnread")
                          : t("emptyUrgent")
                    }
                  />
                ) : (
                  <ul className="pb-4">
                    {filtered.map((item: AppNotification) => (
                      <NotificationItem
                        key={item.id}
                        notification={item}
                        onActivate={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <footer className="shrink-0 border-t border-subtle p-3">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-subtle bg-elevated px-3 py-2.5 text-xs font-semibold text-primary transition hover:border-accent/40 hover:text-accent"
                >
                  <Inbox className="h-3.5 w-3.5" aria-hidden />
                  {t("openInbox")}
                </Link>
              </footer>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("bellLabel")}
        className={[
          "relative rounded-xl border border-subtle/70 bg-surface/80 p-2.5 text-muted",
          "transition hover:border-accent/30 hover:bg-elevated hover:text-primary",
          open ? "border-accent/30 text-primary" : "",
        ].join(" ")}
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute end-1.5 top-1.5 flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-danger opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-danger ring-2 ring-base" />
          </span>
        ) : null}
      </button>
      {drawer}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-elevated text-muted">
        <BellOff className="h-6 w-6" aria-hidden />
      </div>
      <p className="max-w-[16rem] text-sm leading-relaxed text-muted">{message}</p>
    </div>
  );
}
