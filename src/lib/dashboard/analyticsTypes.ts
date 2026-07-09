export interface PeakHourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface DashboardAnalytics {
  attendanceRate: number;
  savedHours: number;
  warningPatientCount: number;
  totalAppointments: number;
  totalCompleted: number;
  totalNoShow: number;
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

export interface FinancialOverview {
  dailyRevenueEgp: number;
  monthlyRevenueEgp: number;
  nawaSavedRevenueEgp: number;
  dailyExpensesEgp: number;
  monthlyExpensesEgp: number;
  outstandingDebtsEgp: number;
  monthlyGrowthPct: number;
  trendLast30Days: FinancialTrendPoint[];
  debtPatients: DebtPatient[];
  recentTransactions: FinancialTransaction[];
  recentExpenses: FinancialTransaction[];
}
