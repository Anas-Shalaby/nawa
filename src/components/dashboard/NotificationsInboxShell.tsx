"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarX2,
  Check,
  ChevronDown,
  Inbox,
  Loader2,
  Package,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { restockInventoryItem } from "@/actions/manageInventory";
import { useNotifications } from "@/components/providers/NotificationsContext";
import type { AppNotification, NotificationKind } from "@/lib/notifications/types";
import type { InboxNotificationSeed } from "@/actions/fetchInboxNotifications";
import { buildWhatsAppActionUrl } from "@/lib/whatsapp/templates";
import type { Locale } from "@/i18n/routing";

type InboxFilter = "all" | "financial" | "system" | "unread";

interface NotificationsInboxShellProps {
  initialNotifications: InboxNotificationSeed[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatExactTime(createdAt: number, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

function formatRelative(
  createdAt: number,
  t: ReturnType<typeof useTranslations>,
): string {
  const mins = Math.max(0, Math.floor((Date.now() - createdAt) / 60_000));
  if (mins < 1) return t("timeJustNow");
  if (mins < 60) return t("timeMinsAgo", { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("timeHoursAgo", { hours });
  return t("timeDaysAgo", { days: Math.floor(hours / 24) });
}

function isSystemKind(kind: NotificationKind): boolean {
  return (
    kind === "system" ||
    kind === "booking" ||
    kind === "inventory" ||
    kind === "urgent" ||
    kind === "cancellation"
  );
}

export function NotificationsInboxShell({
  initialNotifications,
}: NotificationsInboxShellProps) {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale() as Locale;
  const {
    notifications,
    hydrateNotifications,
    markRead,
    markAllRead,
  } = useNotifications();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNotifications[0]?.id ?? null,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    hydrateNotifications(
      initialNotifications.map((item) => ({
        ...item,
        read: false,
      })),
    );
    setHydrated(true);
    if (!selectedId && initialNotifications[0]) {
      setSelectedId(initialNotifications[0].id);
    }
  }, [hydrateNotifications, hydrated, initialNotifications, selectedId]);

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread") return !item.read;
      if (filter === "financial") return item.kind === "financial";
      if (filter === "system") return isSystemKind(item.kind);
      return true;
    });
  }, [notifications, filter]);

  const selected =
    filtered.find((item) => item.id === selectedId) ??
    notifications.find((item) => item.id === selectedId) ??
    null;

  useEffect(() => {
    if (selectedId && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  const filterLabels: Record<InboxFilter, string> = {
    all: t("inbox.filters.all"),
    financial: t("inbox.filters.financial"),
    system: t("inbox.filters.system"),
    unread: t("inbox.filters.unread"),
  };

  function selectNotification(item: AppNotification) {
    setSelectedId(item.id);
    if (!item.read) markRead(item.id);
  }

  return (
    <div
      dir="rtl"
      className="grid h-[calc(100vh-100px)] grid-cols-1 gap-6 overflow-hidden bg-base lg:grid-cols-12"
    >
      {/* Right pane — Inbox feed (RTL first column) */}
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-subtle bg-surface lg:col-span-5">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-subtle px-4 py-3">
          <div className="text-start">
            <h1 className="text-base font-semibold text-primary">{t("inbox.title")}</h1>
            <p className="text-[11px] text-muted">
              {t("inbox.count", { count: filtered.length })}
            </p>
          </div>

          <div className="relative flex items-center gap-2">
            {notifications.some((item) => !item.read) ? (
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
              onClick={() => setFilterOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-xl border border-subtle bg-elevated px-2.5 py-1.5 text-[11px] font-medium text-primary"
            >
              {filterLabels[filter]}
              <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
            </button>

            {filterOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10 cursor-default"
                  aria-label={t("close")}
                  onClick={() => setFilterOpen(false)}
                />
                <ul className="absolute end-0 top-full z-20 mt-1 min-w-[10rem] overflow-hidden rounded-xl border border-subtle bg-surface shadow-xl">
                  {(Object.keys(filterLabels) as InboxFilter[]).map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => {
                          setFilter(key);
                          setFilterOpen(false);
                        }}
                        className={[
                          "flex w-full px-3 py-2 text-start text-xs transition hover:bg-elevated",
                          filter === key
                            ? "font-semibold text-accent"
                            : "text-primary",
                        ].join(" ")}
                      >
                        {filterLabels[key]}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 py-10 text-center">
              <Inbox className="mb-3 h-8 w-8 text-muted" aria-hidden />
              <p className="text-sm text-muted">{t("inbox.emptyList")}</p>
            </div>
          ) : (
            <ul>
              {filtered.map((item) => {
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectNotification(item)}
                      className={[
                        "w-full border-b border-subtle p-4 text-start transition-colors",
                        "cursor-pointer hover:bg-elevated",
                        !item.read ? "bg-accent/5" : "bg-surface",
                        active ? "border-s-4 border-accent bg-elevated/80" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={[
                            "text-sm text-primary",
                            !item.read || active ? "font-bold" : "font-medium",
                          ].join(" ")}
                        >
                          {item.title}
                        </p>
                        {!item.read ? (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {item.body}
                      </p>
                      <p className="mt-2 text-[10px] text-muted/80">
                        {formatRelative(item.createdAt, t)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Left pane — Details & context */}
      <section className="min-h-0 lg:col-span-7">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-subtle bg-surface/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-8">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <header className="shrink-0 border-b border-subtle pb-4 text-start">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {t(`inbox.kinds.${selected.kind}`)}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-primary">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    {formatExactTime(selected.createdAt, locale)}
                  </p>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto pt-5">
                  <p className="mb-6 text-sm leading-relaxed text-muted">
                    {selected.body}
                  </p>
                  <NotificationContextPanel notification={selected} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-1 flex-col items-center justify-center text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-elevated text-muted">
                  <Bell className="h-7 w-7" aria-hidden />
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-muted">
                  {t("inbox.selectPrompt")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function NotificationContextPanel({
  notification,
}: {
  notification: AppNotification;
}) {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [restocked, setRestocked] = useState(false);
  const [slotOpened, setSlotOpened] = useState(false);
  const numberLocale = locale === "ar" ? "ar-EG" : "en-EG";

  if (notification.kind === "financial") {
    const name = notification.meta?.patientName ?? "—";
    const amount = notification.meta?.amountEgp ?? 0;
    const phone = notification.meta?.phoneNumber ?? "";
    const waUrl =
      phone.length > 0
        ? buildWhatsAppActionUrl(phone, "financial", {
            patientName: name,
            amountDue: amount,
            locale,
          })
        : null;

    return (
      <div className="space-y-5 rounded-2xl border border-subtle bg-elevated/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-success/15 text-sm font-bold text-accent-success">
            {initials(name)}
          </div>
          <div className="text-start">
            <p className="text-sm font-semibold text-primary">{name}</p>
            <p className="text-xs text-muted">{t("inbox.debtPatient")}</p>
          </div>
        </div>

        <div className="rounded-xl border border-accent-danger/30 bg-accent-danger/10 px-4 py-3 text-start">
          <p className="text-[11px] text-muted">{t("inbox.amountDue")}</p>
          <p className="mt-1 text-2xl font-bold text-accent-danger">
            {amount.toLocaleString(numberLocale)} {t("inbox.currency")}
          </p>
        </div>

        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent-success px-4 py-3 text-sm font-bold text-base transition hover:brightness-110"
          >
            <Wallet className="h-4 w-4" aria-hidden />
            {t("actions.sendPaymentLink")}
          </a>
        ) : null}

        {notification.meta?.patientId ? (
          <Link
            href={`/dashboard/patients/${notification.meta.patientId}`}
            className="inline-flex w-full items-center justify-center rounded-xl border border-subtle px-3 py-2.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
          >
            {t("actions.viewDetails")}
          </Link>
        ) : null}
      </div>
    );
  }

  if (notification.kind === "cancellation") {
    return (
      <div className="space-y-5 rounded-2xl border border-subtle bg-elevated/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <CalendarX2 className="h-5 w-5" aria-hidden />
          </div>
          <div className="text-start">
            <p className="text-sm font-semibold text-primary">
              {t("inbox.freedSlot")}
            </p>
            <p className="mt-1 text-lg font-bold text-accent">
              {notification.meta?.timeLabel ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {notification.meta?.serviceName
                ? t("inbox.wasService", { service: notification.meta.serviceName })
                : null}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={slotOpened}
          onClick={() => {
            setSlotOpened(true);
            toast.success(t("inbox.slotOpenedToast"));
          }}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-70"
        >
          {slotOpened ? (
            <>
              <Check className="h-4 w-4" aria-hidden />
              {t("inbox.slotOpened")}
            </>
          ) : (
            t("actions.openPublicSlot")
          )}
        </button>

        <Link
          href="/dashboard/upcoming"
          className="inline-flex w-full items-center justify-center rounded-xl border border-subtle px-3 py-2.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
        >
          {t("inbox.openAgenda")}
        </Link>
      </div>
    );
  }

  if (notification.kind === "inventory") {
    const qty = notification.meta?.inventoryQuantity ?? 0;
    const min = notification.meta?.inventoryMinThreshold ?? 0;
    const name = notification.meta?.inventoryName ?? "—";
    const itemId = notification.meta?.inventoryItemId;
    const addQty = Math.max(min * 2 || 10, 10);

    return (
      <div className="space-y-5 rounded-2xl border border-subtle bg-elevated/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-warning/15 text-accent-warning">
            <Package className="h-5 w-5" aria-hidden />
          </div>
          <div className="text-start">
            <p className="text-sm font-semibold text-primary">{name}</p>
            <p className="mt-1 text-xs text-muted">{t("inbox.stockLevels")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-subtle bg-surface px-3 py-3 text-start">
            <p className="text-[11px] text-muted">{t("inbox.currentStock")}</p>
            <p className="mt-1 text-xl font-bold text-accent-danger">{qty}</p>
          </div>
          <div className="rounded-xl border border-subtle bg-surface px-3 py-3 text-start">
            <p className="text-[11px] text-muted">{t("inbox.minStock")}</p>
            <p className="mt-1 text-xl font-bold text-primary">{min}</p>
          </div>
        </div>

        <button
          type="button"
          disabled={!itemId || pending || restocked}
          onClick={() => {
            if (!itemId) return;
            startTransition(async () => {
              const result = await restockInventoryItem(itemId, addQty);
              if (!result.success) {
                toast.error(result.error ?? t("inbox.restockError"));
                return;
              }
              setRestocked(true);
              toast.success(t("inbox.restockSuccess", { amount: addQty }));
            });
          }}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {restocked ? t("inbox.restockDone") : t("actions.confirmRestock")}
        </button>

        <Link
          href="/dashboard/inventory"
          className="inline-flex w-full items-center justify-center rounded-xl border border-subtle px-3 py-2.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
        >
          {t("actions.updateStock")}
        </Link>
      </div>
    );
  }

  // Booking / system fallback
  return (
    <div className="space-y-4 rounded-2xl border border-subtle bg-elevated/50 p-5 text-start">
      {notification.meta?.patientName ? (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
            {initials(notification.meta.patientName)}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">
              {notification.meta.patientName}
            </p>
            {notification.meta.serviceName ? (
              <p className="text-xs text-muted">
                {notification.meta.serviceName}
                {notification.meta.timeLabel
                  ? ` · ${notification.meta.timeLabel}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {notification.actionHref ? (
        <Link
          href={notification.actionHref}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
        >
          {notification.actionLabelKey
            ? t(`actions.${notification.actionLabelKey}`)
            : t("actions.viewDetails")}
        </Link>
      ) : null}
    </div>
  );
}
