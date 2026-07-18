"use client";

import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { AnalyticsKpiBar } from "@/components/dashboard/AnalyticsKpiBar";

interface AnalyticsDashboardShellProps {
  analytics: DashboardAnalytics;
}

export function AnalyticsDashboardShell({ analytics }: AnalyticsDashboardShellProps) {
  const t = useTranslations("dashboard.analyticsPage");

  return (
    <div className="w-full">
      <header className="mb-8 text-start">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <BarChart3 className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">Nawah</span>
        </div>
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <AnalyticsKpiBar analytics={analytics} />
    </div>
  );
}
