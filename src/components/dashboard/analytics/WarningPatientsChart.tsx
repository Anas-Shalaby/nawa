"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS, TOOLTIP_STYLE } from "./chartTheme";
import { ChartCard } from "./ChartCard";

interface WarningPatientsChartProps {
  count: number;
}

export function WarningPatientsChart({ count }: WarningPatientsChartProps) {
  const t = useTranslations("dashboard.analytics");

  const data = useMemo(
    () => [
      { key: "warning", label: t("warningPatientsLabel"), value: count, color: CHART_COLORS.warning },
    ],
    [count, t],
  );

  const yMax = Math.max(count + 1, 5);

  return (
    <ChartCard title={t("chartWarningTitle")} hint={t("chartWarningHint")} delay={0.15}>
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
              cursor={{ fill: "rgba(253, 203, 110, 0.08)" }}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: CHART_COLORS.text }}
              formatter={(value) => [Number(value ?? 0), t("warningPatientsLabel")]}
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
