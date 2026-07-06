"use client";

import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeakHourBucket } from "@/lib/dashboard/analyticsTypes";
import { CHART_COLORS, TOOLTIP_STYLE } from "./analytics/chartTheme";
import { ChartCard } from "./analytics/ChartCard";

interface PeakHoursChartProps {
  data: PeakHourBucket[];
}

export function PeakHoursChart({ data }: PeakHoursChartProps) {
  const t = useTranslations("dashboard.analytics");
  const peakCount = Math.max(...data.map((bucket) => bucket.count), 0);

  return (
    <ChartCard title={t("kpiPeakHours")} hint={t("peakHoursHint")} delay={0.2}>
      <div className="h-64 w-full sm:h-72" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(108, 92, 231, 0.08)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: CHART_COLORS.text }}
              formatter={(value) => [value, t("bookings")]}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={52}>
              {data.map((bucket) => (
                <Cell
                  key={bucket.hour}
                  fill={bucket.count === peakCount && peakCount > 0 ? CHART_COLORS.peak : CHART_COLORS.peakMuted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
