import { hasGrant, resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import { fetchUpcomingAgenda } from "@/lib/queries/agenda";
import { fetchFinancialOverview } from "@/lib/queries/financials";
import { fetchInventoryOverview } from "@/lib/queries/inventory";
import { fetchMissionControlSnapshot } from "@/lib/queries/missionControlSnapshot";
import { fetchPatients, type PatientRecord } from "@/lib/queries/patients";
import { createAuthenticatedClient } from "@/utils/supabase/auth";
import type {
  Appointment,
  DoctorOperationalStatus,
  MissionControlMetrics,
} from "@/lib/dashboard/types";

export interface TodayDashboardSnapshot {
  clinicName: string;
  doctorName: string;
  date: string;
  greetingName: string;
  metrics: MissionControlMetrics;
  canViewRevenue: boolean;
  canCreateWalkIn: boolean;
  canManageQueue: boolean;
  canViewInventory: boolean;
  canViewPatients: boolean;
  canViewAppointments: boolean;
  queueWaiting: Appointment[];
  upcoming: AgendaAppointment[];
  recentPatients: PatientRecord[];
  doctors: DoctorOperationalStatus[];
  outstandingDebtsEgp: number | null;
  debtPatientCount: number | null;
  inventoryLowStockCount: number | null;
}

function nextActionableQueue(appointments: Appointment[]): Appointment[] {
  const waiting = appointments.filter((item) => item.status === "checked_in");
  const outside = appointments.filter(
    (item) => item.status === "pending" || item.status === "confirmed",
  );
  return [...waiting, ...outside].slice(0, 5);
}

export async function fetchTodayDashboardSnapshot(): Promise<TodayDashboardSnapshot> {
  const supabase = await createAuthenticatedClient();
  const permissions = await resolveStaffPermissions(supabase);
  const canViewRevenue = permissions.canViewRevenue;
  const canViewInventory = hasGrant(permissions, "inventory.view");
  const canViewPatients = hasGrant(permissions, "patients.view");
  const canViewAppointments = hasGrant(permissions, "appointments.view");

  const [mc, financials, inventory, agenda, patients] = await Promise.all([
    fetchMissionControlSnapshot(),
    canViewRevenue
      ? fetchFinancialOverview().catch(() => null)
      : Promise.resolve(null),
    canViewInventory
      ? fetchInventoryOverview().catch(() => null)
      : Promise.resolve(null),
    canViewAppointments
      ? fetchUpcomingAgenda().catch(() => [] as AgendaAppointment[])
      : Promise.resolve([] as AgendaAppointment[]),
    canViewPatients
      ? fetchPatients().catch(() => [] as PatientRecord[])
      : Promise.resolve([] as PatientRecord[]),
  ]);

  const greetingName =
    mc.doctorName.trim().length > 0 ? mc.doctorName.trim() : mc.clinicName;

  const recentPatients = patients
    .filter((patient) => !patient.isArchived)
    .slice(0, 5);

  const upcoming = agenda
    .filter((item) => item.status === "pending" || item.status === "confirmed")
    .slice(0, 5);

  return {
    clinicName: mc.clinicName,
    doctorName: mc.doctorName,
    date: mc.date,
    greetingName,
    metrics: mc.metrics,
    canViewRevenue,
    canCreateWalkIn: mc.canCreateWalkIn,
    canManageQueue: mc.canManageQueue,
    canViewInventory,
    canViewPatients,
    canViewAppointments,
    queueWaiting: nextActionableQueue(mc.appointments),
    upcoming,
    recentPatients,
    doctors: mc.doctors,
    outstandingDebtsEgp: financials?.outstandingDebtsEgp ?? null,
    debtPatientCount: financials ? financials.debtPatients.length : null,
    inventoryLowStockCount: inventory?.lowStockCount ?? null,
  };
}
