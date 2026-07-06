"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, TOOLTIP_STYLE } from "./chartTheme";
import { ChartCard } from "./ChartCard";

interface SavedHoursChartProps {
  savedHours: number;
}

export function SavedHoursChart({ savedHours }: SavedHoursChartProps) {
  const t = useTranslations("dashboard.analytics");

  const data = useMemo(
    () => [
      { key: "saved", label: t("savedHoursLabel"), value: savedHours, color: CHART_COLORS.savedHours },
    ],
    [savedHours, t],
  );

  const yMax = Math.max(Math.ceil(savedHours + 2), 8);

  return (
    <ChartCard title={t("chartSavedHoursTitle")} hint={t("chartSavedHoursHint")} delay={0.1}>
      <div className="h-52 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, yMax]}
              tick={{ fill: CHART_COLORS.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(116, 185, 255, 0.08)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: CHART_COLORS.text }}
              formatter={(value) => [
                t("kpiHours", { value: Number(value ?? 0) }),
                t("savedHoursLabel"),
              ]}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} maxBarSize={72}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
