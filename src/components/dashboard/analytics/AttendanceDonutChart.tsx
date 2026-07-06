"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { CHART_COLORS, TOOLTIP_STYLE } from "./chartTheme";
import { ChartCard } from "./ChartCard";

interface AttendanceDonutChartProps {
  analytics: DashboardAnalytics;
}

export function AttendanceDonutChart({ analytics }: AttendanceDonutChartProps) {
  const t = useTranslations("dashboard.analytics");

  const data = [
    { key: "completed", name: t("statusCompleted"), value: analytics.totalCompleted, color: CHART_COLORS.completed },
    { key: "noShow", name: t("statusNoShow"), value: analytics.totalNoShow, color: CHART_COLORS.noShow },
    {
      key: "other",
      name: t("statusOther"),
      value: Math.max(analytics.totalAppointments - analytics.totalCompleted - analytics.totalNoShow, 0),
      color: CHART_COLORS.other,
    },
  ].filter((item) => item.value > 0);

  const isEmpty = data.length === 0;

  return (
    <ChartCard title={t("chartAttendanceTitle")} hint={t("chartAttendanceHint")} delay={0}>
      <div className="relative h-52 w-full" dir="ltr">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">{t("emptyChart")}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: CHART_COLORS.text }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-3xl font-semibold tabular-nums text-primary">
                {t("kpiPercent", { value: analytics.attendanceRate })}
              </p>
              <p className="mt-1 text-xs text-muted">{t("attendanceCenterLabel")}</p>
            </div>
          </>
        )}
      </div>
    </ChartCard>
  );
}
