export interface PeakHourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface AnalyticsServiceRank {
  name: string;
  count: number;
  revenueEgp: number;
}

export interface AnalyticsTrendPoint {
  dateKey: string;
  label: string;
  completed: number;
  noShow: number;
  canceled: number;
}

export interface DashboardAnalytics {
  rangeDays: number;
  /** null when there is no settled volume (avoid fake 100%). */
  attendanceRate: number | null;
  noShowRate: number | null;
  cancelRate: number | null;
  newPatients: number;
  returningPatients: number;
  returningRate: number | null;
  revenueGrowthPct: number | null;
  periodRevenueEgp: number;
  previousRevenueEgp: number;
  averageWaitMinutes: number | null;
  savedHours: number;
  warningPatientCount: number;
  totalAppointments: number;
  totalCompleted: number;
  totalNoShow: number;
  totalCanceled: number;
  peakHours: PeakHourBucket[];
  topServices: AnalyticsServiceRank[];
  reliabilityTrend: AnalyticsTrendPoint[];
}

export interface FinancialTransaction {
  id: string;
  patientName: string;
  serviceName: string;
  priceEgp: number;
  appointmentDate: string;
  isBackfill: boolean;
}

export interface DebtPatient {
  id: string;
  name: string;
  phoneNumber: string;
  amountDue: number;
}

export interface FinancialTrendPoint {
  dateKey: string;
  label: string;
  incomeEgp: number;
  expenseEgp: number;
}

export interface FinancialServiceRank {
  name: string;
  revenueEgp: number;
  count: number;
}

export interface FinancialPatientRank {
  id: string;
  name: string;
  revenueEgp: number;
}

export interface RecentPaymentItem {
  id: string;
  patientId: string;
  patientName: string;
  amountPaid: number;
  paidAt: string;
}

export interface FinancialOverview {
  dailyRevenueEgp: number;
  weeklyRevenueEgp: number;
  monthlyRevenueEgp: number;
  nawaSavedRevenueEgp: number;
  /** No-show opportunity cost (legacy field name kept for compatibility). */
  dailyExpensesEgp: number;
  /** No-show opportunity cost (legacy field name kept for compatibility). */
  monthlyExpensesEgp: number;
  outstandingDebtsEgp: number;
  monthlyGrowthPct: number;
  averageVisitValueEgp: number;
  completedVisitsMonth: number;
  collectionsTodayEgp: number;
  collectionsWeekEgp: number;
  collectionsMonthEgp: number;
  topServices: FinancialServiceRank[];
  topPatientsByRevenue: FinancialPatientRank[];
  recentPayments: RecentPaymentItem[];
  trendLast30Days: FinancialTrendPoint[];
  debtPatients: DebtPatient[];
  recentTransactions: FinancialTransaction[];
  recentExpenses: FinancialTransaction[];
}
