export interface PeakHourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface DashboardAnalytics {
  attendanceRate: number;
  savedHours: number;
  warningPatientCount: number;
  peakHours: PeakHourBucket[];
}

export interface FinancialTransaction {
  id: string;
  patientName: string;
  serviceName: string;
  priceEgp: number;
  appointmentDate: string;
  isBackfill: boolean;
}

export interface FinancialOverview {
  dailyRevenueEgp: number;
  monthlyRevenueEgp: number;
  nawaSavedRevenueEgp: number;
  recentTransactions: FinancialTransaction[];
}
