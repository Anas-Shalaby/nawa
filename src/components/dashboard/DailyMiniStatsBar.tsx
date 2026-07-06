"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, Clock3, Users } from "lucide-react";
import type { Appointment } from "@/lib/dashboard/types";
import {
  computeDailyMiniStats,
  type DailyMiniStats,
} from "@/lib/dashboard/miniStats";

interface DailyMiniStatsBarProps {
  appointments: Appointment[];
  initialStats: DailyMiniStats;
  canViewRevenue: boolean;
}

const STAT_ACCENTS = {
  total: { icon: Users, color: "#74B9FF" },
  waiting: { icon: Clock3, color: "#FDCB6E" },
  completed: { icon: CheckCircle2, color: "#55EFC4" },
  revenue: { icon: Banknote, color: "#A29BFE" },
} as const;

export function DailyMiniStatsBar({
  appointments,
  initialStats,
  canViewRevenue,
}: DailyMiniStatsBarProps) {
  const t = useTranslations("dashboard.miniStats");

  const stats = useMemo(() => {
    if (appointments.length === 0) {
      return initialStats;
    }
    return computeDailyMiniStats(appointments);
  }, [appointments, initialStats]);

  const items = [
    { key: "total" as const, label: t("total"), value: String(stats.total) },
    { key: "waiting" as const, label: t("waiting"), value: String(stats.waiting) },
    { key: "completed" as const, label: t("completed"), value: String(stats.completed) },
    ...(canViewRevenue
      ? [
          {
            key: "revenue" as const,
            label: t("revenue"),
            value: t("revenueValue", { amount: stats.expectedRevenueEgp.toLocaleString() }),
          },
        ]
      : []),
  ];

  return (
    <div className="mb-5 grid shrink-0 grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item, index) => {
        const accent = STAT_ACCENTS[item.key];
        const Icon = accent.icon;

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.28 }}
            className="relative overflow-hidden rounded-2xl border border-subtle/50 bg-surface/70 px-5 py-4 backdrop-blur-sm"
          >
            <div
              className="pointer-events-none absolute -end-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: accent.color }}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-2">
              <div className="min-w-0 text-start">
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums text-primary sm:text-3xl">
                  {item.value}
                </p>
              </div>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accent.color}18`, color: accent.color }}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
