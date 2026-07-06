"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeakHourBucket } from "@/lib/dashboard/analyticsTypes";

interface PeakHoursChartProps {
  data: PeakHourBucket[];
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const t = useTranslations("dashboard.analytics");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
      className="rounded-2xl border border-subtle/50 bg-surface/80 px-6 py-5 backdrop-blur-sm"
    >
      <div className="mb-5 text-start">
        <p className="text-sm font-medium text-muted">
          {t("kpiPeakHours")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("peakHoursHint")}</p>
      </div>

      <div className="h-56 w-full sm:h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "#8888A0", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#8888A0", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(108, 92, 231, 0.08)" }}
              contentStyle={{
                background: "#12121A",
                border: "1px solid #2A2A3A",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#E8E8F0" }}
              formatter={(value) => [value, t("bookings")]}
            />
            <Bar
              dataKey="count"
              fill="#6C5CE7"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
