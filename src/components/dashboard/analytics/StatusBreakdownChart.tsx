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
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { CHART_COLORS, TOOLTIP_STYLE } from "./chartTheme";
import { ChartCard } from "./ChartCard";

interface StatusBreakdownChartProps {
  analytics: DashboardAnalytics;
}

export function StatusBreakdownChart({ analytics }: StatusBreakdownChartProps) {
  const t = useTranslations("dashboard.analytics");

  const data = [
    {
      key: "completed",
      label: t("statusCompleted"),
      value: analytics.totalCompleted,
      color: CHART_COLORS.completed,
    },
    {
      key: "noShow",
      label: t("statusNoShow"),
      value: analytics.totalNoShow,
      color: CHART_COLORS.noShow,
    },
    {
      key: "other",
      label: t("statusOther"),
      value: Math.max(analytics.totalAppointments - analytics.totalCompleted - analytics.totalNoShow, 0),
      color: CHART_COLORS.other,
    },
  ];

  const isEmpty = analytics.totalAppointments === 0;

  return (
    <ChartCard title={t("chartStatusTitle")} hint={t("chartStatusHint")} delay={0.05}>
      <div className="h-52 w-full" dir="ltr">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">{t("emptyChart")}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="label"
                width={96}
                tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(108, 92, 231, 0.08)" }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: CHART_COLORS.text }}
                formatter={(value) => [value, t("appointments")]}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
