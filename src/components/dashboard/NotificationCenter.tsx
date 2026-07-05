"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useNotifications } from "@/components/providers/NotificationsContext";

export function NotificationCenter() {
  const t = useTranslations("dashboard.notifications");
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleToggle() {
    setOpen((value) => {
      const next = !value;
      if (next) markAllRead();
      return next;
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
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
          <span
            className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-base"
            aria-hidden
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("centerTitle")}
          className={[
            "absolute end-0 top-[calc(100%+0.5rem)] z-[120] w-[min(100vw-2rem,20rem)]",
            "overflow-hidden rounded-2xl border border-subtle/80 bg-elevated/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-subtle/70 px-4 py-3">
            <p className="text-sm font-semibold text-primary">{t("centerTitle")}</p>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-medium text-accent transition hover:brightness-110"
              >
                {t("markAllRead")}
              </button>
            ) : null}
          </div>

          <ul className="max-h-80 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-muted">{t("empty")}</li>
            ) : (
              notifications.map((item) => (
                <li
                  key={item.id}
                  className={[
                    "rounded-xl border px-3 py-3 text-start transition",
                    item.read
                      ? "border-transparent bg-transparent"
                      : "border-accent/20 bg-accent/5",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-primary">{t("toastTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {t("toastDescription", {
                      patient: item.patientName,
                      service: item.serviceName,
                      time: item.timeLabel,
                    })}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
