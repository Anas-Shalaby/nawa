"use server";

import type { Appointment, AppointmentStatus } from "@/lib/dashboard/types";
import { compareCallNext, statusForZone, zoneForStatus } from "@/lib/dashboard/missionControlSelectors";
import {
  APPOINTMENT_SELECT,
  mapAppointmentRow,
  type AppointmentJoinRow,
} from "@/lib/dashboard/mapAppointment";
import { resolveStaffPermissions } from "@/lib/auth/staffPermissions";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";

export interface MissionControlActionResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
}

async function loadAppointment(
  supabase: Awaited<ReturnType<typeof createAuthenticatedClient>>,
  tenantId: string,
  appointmentId: string,
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", appointmentId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  return mapAppointmentRow(data as AppointmentJoinRow);
}

async function assertCanManageQueue(): Promise<string | null> {
  const supabase = await createAuthenticatedClient();
  const { canManageQueue } = await resolveStaffPermissions(supabase);
  if (!canManageQueue) return "You do not have permission to manage the queue.";
  return null;
}

export async function callNextPatient(): Promise<MissionControlActionResult> {
  const denied = await assertCanManageQueue();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const { startIso, endExclusiveIso } = await import("@/lib/datetime/cairo").then(
      (m) => m.getCairoDayQueryBounds(m.getCairoTodayKey()),
    );

    const { data, error } = await supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("tenant_id", tenantId)
      .gte("appointment_date", startIso)
      .lt("appointment_date", endExclusiveIso)
      .eq("status", "checked_in")
      .order("appointment_date", { ascending: true });

    if (error) return { success: false, error: error.message };

    const waiting = ((data ?? []) as AppointmentJoinRow[])
      .map(mapAppointmentRow)
      .sort(compareCallNext);

    const next = waiting[0];
    if (!next) return { success: false, error: "No patients in the waiting room." };

    const result = await updateAppointmentStatus(next.id, "in_session");
    if (!result.success) return { success: false, error: result.error };

    const refreshed = await loadAppointment(supabase, tenantId, next.id);
    return { success: true, appointment: refreshed ?? { ...next, status: "in_session" } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Call next failed.",
    };
  }
}

export async function markEmergency(
  appointmentId: string,
): Promise<MissionControlActionResult> {
  const denied = await assertCanManageQueue();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("appointments")
      .update({ priority: "emergency" })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    const refreshed = await loadAppointment(supabase, tenantId, appointmentId);
    return refreshed
      ? { success: true, appointment: refreshed }
      : { success: false, error: "Appointment not found." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not mark emergency.",
    };
  }
}

export async function assignDoctorAndRoom(
  appointmentId: string,
  staffId: string | null,
  roomId: string | null,
): Promise<MissionControlActionResult> {
  const denied = await assertCanManageQueue();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { error } = await supabase
      .from("appointments")
      .update({
        assigned_staff_id: staffId,
        room_id: roomId,
      })
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };

    const refreshed = await loadAppointment(supabase, tenantId, appointmentId);
    return refreshed
      ? { success: true, appointment: refreshed }
      : { success: false, error: "Appointment not found." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Assignment failed.",
    };
  }
}

export async function startSession(
  appointmentId: string,
): Promise<MissionControlActionResult> {
  return transitionStatus(appointmentId, "in_session");
}

export async function completeSession(
  appointmentId: string,
): Promise<MissionControlActionResult> {
  return transitionStatus(appointmentId, "completed");
}

async function transitionStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<MissionControlActionResult> {
  const denied = await assertCanManageQueue();
  if (denied) return { success: false, error: denied };

  const result = await updateAppointmentStatus(appointmentId, status);
  if (!result.success) return { success: false, error: result.error };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const refreshed = await loadAppointment(supabase, tenantId, appointmentId);
    return refreshed
      ? { success: true, appointment: refreshed }
      : { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Status update failed.",
    };
  }
}

export async function updateDoctorStatus(
  staffId: string,
  availability: "available" | "busy" | "break" | "offline",
  roomId?: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const { canManageClinic } = await resolveStaffPermissions(supabase);
    if (!canManageClinic) {
      return { success: false, error: "You do not have permission to update doctor status." };
    }

    const { error } = await supabase
      .from("staff_profiles")
      .update({
        availability,
        current_room_id: roomId ?? null,
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", staffId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update doctor status.",
    };
  }
}

export async function moveAppointmentToZone(
  appointmentId: string,
  zone: "outside" | "waiting" | "doctor",
): Promise<MissionControlActionResult> {
  const denied = await assertCanManageQueue();
  if (denied) return { success: false, error: denied };

  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);

    const { data, error } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", appointmentId)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Appointment not found." };
    }

    const nextStatus = statusForZone(zone, data.status as AppointmentStatus);
    if (zoneForStatus(data.status as AppointmentStatus) === zone) {
      const current = await loadAppointment(supabase, tenantId, appointmentId);
      return current ? { success: true, appointment: current } : { success: true };
    }

    return transitionStatus(appointmentId, nextStatus);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Move failed.",
    };
  }
}

export async function searchPatientsQuick(
  query: string,
): Promise<{ id: string; name: string; phoneNumber: string }[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createAuthenticatedClient();
  const tenantId = await resolveTenantId(supabase);

  const phoneQuery = trimmed.replace(/\D/g, "");
  let builder = supabase
    .from("patients")
    .select("id, name, phone_number")
    .eq("tenant_id", tenantId)
    .limit(8);

  if (phoneQuery.length >= 3) {
    builder = builder.ilike("phone_number", `%${phoneQuery}%`);
  } else {
    builder = builder.ilike("name", `%${trimmed}%`);
  }

  const { data, error } = await builder;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    phoneNumber: row.phone_number,
  }));
}
