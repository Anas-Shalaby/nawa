"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { DailyPulseStats } from "@/lib/dashboard/types";

interface DailyPulseBarProps {
  stats: DailyPulseStats;
}

const STAT_CONFIG = [
  { key: "total", color: "#6C5CE7", labelKey: "pulseTotal" },
  { key: "pending", color: "#FDCB6E", labelKey: "pulsePending" },
  { key: "completed", color: "#55EFC4", labelKey: "pulseCompleted" },
  { key: "noShows", color: "#FF6B6B", labelKey: "pulseNoShows" },
] as const;

export function DailyPulseBar({ stats }: DailyPulseBarProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STAT_CONFIG.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.25 }}
          className="rounded-xl border border-subtle bg-surface/80 px-4 py-3 backdrop-blur-sm"
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: stat.color }}
              aria-hidden
            />
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {t(stat.labelKey)}
            </span>
          </div>
          <motion.p
            key={stats[stat.key]}
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="text-2xl font-semibold tabular-nums text-primary"
          >
            {stats[stat.key]}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
}
