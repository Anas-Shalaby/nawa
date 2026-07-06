"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KanbanSquare,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";

type HeroNav = "queue" | "upcoming" | "patients" | "services" | "analytics";
type MainView = "queue" | "finance";

const STATUS_COLORS = {
  inSession: "#A29BFE",
  confirmed: "#00CEC9",
  checkedIn: "#74B9FF",
} as const;

const CHART_BARS = [42, 58, 51, 72, 64, 88, 76, 100];

function WindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 bg-slate-950/80 px-4 py-2.5">
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-accent-danger/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-success/80" />
      </div>
      <p className="flex-1 text-center text-[11px] font-medium text-muted">{title}</p>
      <div className="w-[52px]" aria-hidden />
    </div>
  );
}

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: `${color}44`,
        backgroundColor: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  );
}

export function HeroDashboardPreview() {
  const t = useTranslations("landing.hero.preview");
  const layout = useTranslations("dashboard.layout");
  const stats = useTranslations("dashboard.miniStats");

  const [activeNav, setActiveNav] = useState<HeroNav>("queue");
  const [mainView, setMainView] = useState<MainView>("queue");
  const [selectedPatientId, setSelectedPatientId] = useState("p1");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const patients = useMemo(
    () => [
      {
        id: "p1",
        name: t("patient1"),
        time: "10:30",
        service: t("service1"),
        status: t("statusInSession"),
        statusKey: "inSession" as const,
      },
      {
        id: "p2",
        name: t("patient2"),
        time: "11:00",
        service: t("service2"),
        status: t("statusConfirmed"),
        statusKey: "confirmed" as const,
      },
      {
        id: "p3",
        name: t("patient3"),
        time: "11:30",
        service: t("service3"),
        status: t("statusCheckedIn"),
        statusKey: "checkedIn" as const,
      },
    ],
    [t],
  );

  const selected = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];

  const navItems: { id: HeroNav; icon: typeof KanbanSquare; label: string }[] = [
    { id: "queue", icon: KanbanSquare, label: layout("navQueue") },
    { id: "upcoming", icon: CalendarDays, label: layout("navUpcoming") },
    { id: "patients", icon: Users, label: layout("navPatients") },
    { id: "services", icon: Stethoscope, label: layout("navServices") },
    { id: "analytics", icon: BarChart3, label: layout("navAnalytics") },
  ];

  const miniStats = [
    { icon: Users, label: stats("total"), value: "12", color: "#74B9FF" },
    { icon: Clock3, label: stats("waiting"), value: "4", color: "#FDCB6E" },
    { icon: CheckCircle2, label: stats("completed"), value: "6", color: "#55EFC4" },
    {
      icon: Banknote,
      label: stats("revenue"),
      value: stats("revenueValue", { amount: "18,500" }),
      color: "#A29BFE",
    },
  ];

  const mainTabs: { id: MainView; label: string }[] = [
    { id: "queue", label: t("tabQueue") },
    { id: "finance", label: t("tabFinance") },
  ];

  function handleNavClick(navId: HeroNav) {
    setActiveNav(navId);
    if (navId === "analytics") {
      setMainView("finance");
      return;
    }
    setMainView("queue");
  }

  const headerTitle =
    activeNav === "analytics" || mainView === "finance"
      ? layout("navAnalytics")
      : layout("navQueue");

  return (
    <motion.div
      aria-label={t("windowTitle")}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.55 }}
      className="landing-dashboard-preview relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_32px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-success/6"
        aria-hidden
      />

      <div className="relative">
        <WindowChrome title={t("windowTitle")} />

        <div className="flex min-h-[420px] bg-base/95 sm:min-h-[480px] md:min-h-[520px]">
          <aside className="hidden w-44 shrink-0 flex-col border-e border-subtle/80 bg-surface/90 sm:flex">
            <div className="flex items-center gap-2.5 border-b border-subtle/80 px-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <Image src="/icons/icon-192.png" alt="" width={28} height={28} />
              </div>
              <div className="min-w-0 text-start">
                <p className="truncate text-xs font-semibold text-primary">Nawa</p>
                <p className="truncate text-[10px] text-muted">{layout("brandTagline")}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-0.5 p-2">
              <p className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted/70">
                {layout("sectionOperations")}
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={[
                      "relative flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-[11px] font-medium transition-colors",
                      isActive ? "text-accent" : "text-muted hover:bg-elevated/60 hover:text-primary",
                    ].join(" ")}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="hero-sidebar-active"
                        className="absolute inset-0 rounded-lg bg-accent/15"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="relative z-10 truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="relative flex h-11 items-center justify-between border-b border-subtle/80 bg-base/80 px-3 sm:px-4">
              <p className="truncate text-xs font-semibold text-primary sm:text-sm">{t("clinicName")}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className={[
                    "relative flex h-7 w-7 items-center justify-center rounded-lg border transition",
                    notificationsOpen
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-subtle/80 text-muted hover:border-accent/30 hover:text-primary",
                  ].join(" ")}
                  aria-label={t("notificationLabel")}
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-danger" aria-hidden />
                </button>
                <span className="hidden rounded-lg border border-subtle/80 px-2 py-1 text-[10px] text-muted sm:inline">
                  AR
                </span>
              </div>

              <AnimatePresence>
                {notificationsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute end-3 top-full z-20 mt-2 w-56 rounded-xl border border-subtle/80 bg-elevated p-3 shadow-xl sm:end-4"
                  >
                    <p className="text-[10px] font-semibold text-primary">{t("notificationTitle")}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">{t("notificationBody")}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </header>

            <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {miniStats.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.35 }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      className="cursor-default rounded-xl border border-subtle/60 bg-surface/50 px-3 py-2.5 transition-shadow hover:border-accent/25 hover:shadow-[0_8px_24px_rgba(108,92,231,0.08)]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" style={{ color: item.color }} aria-hidden />
                        <p className="truncate text-[10px] text-muted">{item.label}</p>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-primary">{item.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="rounded-xl border border-subtle/50 bg-surface/30 px-3 py-2.5 sm:px-4">
                  <p className="text-xs font-semibold text-primary sm:text-sm">{headerTitle}</p>
                  <p className="mt-0.5 text-[10px] text-muted sm:text-xs">{t("queueSubtitle")}</p>
                </div>

                <div className="relative flex gap-1 rounded-xl bg-base/70 p-1 sm:min-w-[240px]">
                  {mainTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setMainView(tab.id);
                        if (tab.id === "finance") setActiveNav("analytics");
                        else setActiveNav("queue");
                      }}
                      className="relative flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors sm:text-xs"
                    >
                      {mainView === tab.id ? (
                        <motion.span
                          layoutId="hero-main-tab"
                          className="absolute inset-0 rounded-lg border border-white/10 bg-surface/90 shadow-sm"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <span
                        className={[
                          "relative z-10",
                          mainView === tab.id ? "text-primary" : "text-muted hover:text-primary/80",
                        ].join(" ")}
                      >
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[240px]">
                <AnimatePresence mode="wait">
                  {mainView === "queue" ? (
                    <motion.div
                      key="queue"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="grid gap-3 lg:grid-cols-5"
                    >
                      <div className="space-y-2 lg:col-span-2">
                        {patients.map((patient) => {
                          const isActive = patient.id === selectedPatientId;
                          const color = STATUS_COLORS[patient.statusKey];

                          return (
                            <motion.button
                              key={patient.id}
                              type="button"
                              onClick={() => setSelectedPatientId(patient.id)}
                              onMouseEnter={() => setSelectedPatientId(patient.id)}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ type: "spring", stiffness: 400, damping: 28 }}
                              className={[
                                "w-full rounded-xl border px-3 py-2.5 text-start transition-shadow duration-200",
                                isActive
                                  ? "border-accent/40 bg-accent/10 shadow-[0_0_20px_rgba(108,92,231,0.15)]"
                                  : "border-subtle/60 bg-base/50 hover:border-subtle hover:bg-surface/60",
                              ].join(" ")}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-semibold text-primary sm:text-sm">
                                  {patient.name}
                                </span>
                                <span
                                  className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold tabular-nums sm:text-[11px]"
                                  style={{ color, backgroundColor: `${color}14` }}
                                >
                                  {patient.time}
                                </span>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="truncate text-[10px] text-muted sm:text-xs">{patient.service}</span>
                                <StatusPill label={patient.status} color={color} />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      <motion.div layout className="rounded-xl border border-accent/25 bg-elevated/70 p-3 sm:p-4 lg:col-span-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-accent sm:text-[11px]">
                          {t("detailLabel")}
                        </p>
                        <motion.p
                          key={selected.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mt-2 text-base font-semibold text-primary sm:text-lg"
                        >
                          {selected.name}
                        </motion.p>
                        <motion.div
                          key={`${selected.id}-meta`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.05 }}
                          className="mt-3 grid grid-cols-2 gap-2 sm:mt-4"
                        >
                          <div className="rounded-lg border border-subtle/60 bg-base/50 p-2.5 sm:p-3">
                            <p className="text-[10px] text-muted sm:text-[11px]">{t("detailService")}</p>
                            <p className="mt-1 text-xs font-medium sm:text-sm">{selected.service}</p>
                          </div>
                          <div className="rounded-lg border border-subtle/60 bg-base/50 p-2.5 sm:p-3">
                            <p className="text-[10px] text-muted sm:text-[11px]">{t("detailTime")}</p>
                            <p className="mt-1 text-xs font-medium tabular-nums sm:text-sm">{selected.time}</p>
                          </div>
                        </motion.div>
                        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-lg bg-accent px-3 py-1.5 text-[10px] font-semibold text-white sm:text-xs"
                          >
                            {t("actionPrimary")}
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.03, borderColor: "rgba(108,92,231,0.4)" }}
                            whileTap={{ scale: 0.97 }}
                            className="rounded-lg border border-subtle px-3 py-1.5 text-[10px] text-muted sm:text-xs"
                          >
                            {t("actionSecondary")}
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="finance"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-4"
                    >
                      <div className="rounded-xl border border-accent-success/25 bg-base/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted">{t("savedRevenueLabel")}</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-accent-success sm:text-3xl">
                              {t("savedRevenueValue")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full border border-accent-success/25 bg-accent-success/10 px-2.5 py-1 text-xs font-semibold text-accent-success">
                            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                            {t("savedRevenueDelta")}
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] text-muted sm:text-xs">{t("savedRevenueHint")}</p>
                      </div>

                      <div className="rounded-xl border border-subtle/70 bg-surface/50 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm font-semibold text-primary">{t("chartTitle")}</p>
                          <Activity className="h-4 w-4 text-muted" aria-hidden />
                        </div>
                        <div className="flex h-28 items-end gap-1.5" aria-hidden>
                          {CHART_BARS.map((height, index) => (
                            <motion.div
                              key={index}
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{
                                delay: 0.04 * index,
                                duration: 0.45,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              whileHover={{ scaleY: 1.06, opacity: 0.9 }}
                              className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-accent-success/20 to-accent-success/75"
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between text-[10px] text-muted">
                          <span>{t("chartStart")}</span>
                          <span>{t("chartEnd")}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
