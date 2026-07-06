"use client";

import type { DashboardAnalytics } from "@/lib/dashboard/analyticsTypes";
import { AttendanceDonutChart } from "./analytics/AttendanceDonutChart";
import { PeakHoursChart } from "./PeakHoursChart";
import { SavedHoursChart } from "./analytics/SavedHoursChart";
import { StatusBreakdownChart } from "./analytics/StatusBreakdownChart";
import { WarningPatientsChart } from "./analytics/WarningPatientsChart";

interface AnalyticsKpiBarProps {
  analytics: DashboardAnalytics;
}

export function AnalyticsKpiBar({ analytics }: AnalyticsKpiBarProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AttendanceDonutChart analytics={analytics} />
      <StatusBreakdownChart analytics={analytics} />
      <SavedHoursChart savedHours={analytics.savedHours} />
      <WarningPatientsChart count={analytics.warningPatientCount} />
      <div className="lg:col-span-2">
        <PeakHoursChart data={analytics.peakHours} />
      </div>
    </div>
  );
}
