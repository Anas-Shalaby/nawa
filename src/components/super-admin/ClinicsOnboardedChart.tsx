"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SaaSHealthMetrics } from "@/lib/super-admin/metrics";

interface ClinicsOnboardedChartProps {
  data: SaaSHealthMetrics["clinicsOnboardedByMonth"];
}

export function ClinicsOnboardedChart({ data }: ClinicsOnboardedChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-[#0a0a0c] text-sm text-zinc-500">
        لا توجد بيانات تسجيل بعد
      </div>
    );
  }

  return (
    <div className="h-72 rounded-xl border border-zinc-800 bg-[#0a0a0c] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#fafafa" }}
            formatter={(value) => [`${value}`, "عيادات"]}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
