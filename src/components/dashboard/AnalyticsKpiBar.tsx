"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { PeakHoursChart } from "./PeakHoursChart";

interface AnalyticsKpiBarProps {
  analytics: DashboardAnalytics;
}

const STAT_CONFIG = [
  {
    key: "attendanceRate" as const,
    color: "#55EFC4",
    icon: TrendingUp,
    labelKey: "kpiAttendance",
    suffixKey: "kpiPercent",
  },
  {
    key: "savedHours" as const,
    color: "#74B9FF",
    icon: Clock,
    labelKey: "kpiSavedHours",
    suffixKey: "kpiHours",
  },
  {
    key: "warningPatientCount" as const,
    color: "#FDCB6E",
    icon: AlertTriangle,
    labelKey: "kpiWarning",
    suffixKey: null,
  },
];

export function AnalyticsKpiBar({ analytics }: AnalyticsKpiBarProps) {
  const t = useTranslations("dashboard.analytics");

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STAT_CONFIG.map((stat, index) => {
          const Icon = stat.icon;
          const value = analytics[stat.key];

          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
              className="rounded-xl border border-subtle bg-surface/80 px-4 py-3 backdrop-blur-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color: stat.color }} aria-hidden />
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t(stat.labelKey)}
                </span>
              </div>
              <motion.p
                key={String(value)}
                initial={{ scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="text-2xl font-semibold tabular-nums text-primary"
              >
                {stat.suffixKey === "kpiPercent"
                  ? t(stat.suffixKey, { value })
                  : stat.suffixKey === "kpiHours"
                    ? t(stat.suffixKey, { value })
                    : value}
              </motion.p>
            </motion.div>
          );
        })}
      </div>

      <PeakHoursChart data={analytics.peakHours} />
    </div>
  );
}
