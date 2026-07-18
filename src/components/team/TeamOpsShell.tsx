"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { Appointment } from "@/lib/dashboard/types";
import { buildTeamOpsDerived } from "@/lib/team/buildTeamOpsDerived";
import { filterMembers } from "@/lib/team/teamOpsSelectors";
import { useTeamOpsRealtime } from "@/lib/team/useTeamOpsRealtime";
import type {
  OverviewFilterKey,
  TeamLiveStatus,
  TeamOpsSnapshot,
  TeamRole,
  TeamStaffBase,
} from "@/lib/team/types";
import { TeamOpsHeader } from "./TeamOpsHeader";
import { OperationsOverview } from "./OperationsOverview";
import { OpsInsightsStrip } from "./OpsInsightsStrip";
import { TeamMemberCard } from "./TeamMemberCard";
import { LiveActivityRail } from "./LiveActivityRail";
import { TeamEmptyState } from "./TeamEmptyState";
import { InviteMemberModal } from "./InviteMemberModal";
import { AssignPatientSheet } from "./AssignPatientSheet";
import { TransferPatientSheet } from "./TransferPatientSheet";
import { MemberProfileDrawer } from "./MemberProfileDrawer";

interface TeamOpsShellProps {
  snapshot: TeamOpsSnapshot;
}

export function TeamOpsShell({ snapshot }: TeamOpsShellProps) {
  const router = useRouter();
  const [staff, setStaff] = useState(snapshot.staff);
  const [appointments, setAppointments] = useState(snapshot.appointments);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<TeamRole | "all">("all");
  const [status, setStatus] = useState<TeamLiveStatus | "all">("all");
  const [overviewFilter, setOverviewFilter] = useState<OverviewFilterKey>("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [assignForId, setAssignForId] = useState<string | null>(null);
  const [transferForId, setTransferForId] = useState<string | null>(null);
  const [profileForId, setProfileForId] = useState<string | null>(null);

  useEffect(() => {
    setStaff(snapshot.staff);
    setAppointments(snapshot.appointments);
  }, [snapshot.staff, snapshot.appointments]);

  const derived = useMemo(
    () =>
      buildTeamOpsDerived({
        staff,
        appointments,
        capacityMinutes: snapshot.capacityMinutes,
        isClinicOpen: snapshot.isClinicOpen,
        workingHoursLabel: snapshot.workingHoursLabel,
        doctorName: snapshot.doctorName,
      }),
    [
      staff,
      appointments,
      snapshot.capacityMinutes,
      snapshot.isClinicOpen,
      snapshot.workingHoursLabel,
      snapshot.doctorName,
    ],
  );

  const { members, overview, insights, activity } = derived;

  const onAppointmentUpsert = useCallback((appointment: Appointment) => {
    setAppointments((current) => {
      const exists = current.some((item) => item.id === appointment.id);
      if (exists) {
        return current.map((item) => (item.id === appointment.id ? appointment : item));
      }
      return [...current, appointment].sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      );
    });
  }, []);

  const onAppointmentRemove = useCallback((appointmentId: string) => {
    setAppointments((current) => current.filter((item) => item.id !== appointmentId));
  }, []);

  const onStaffUpsert = useCallback((next: TeamStaffBase) => {
    if (
      snapshot.currentUserId &&
      next.userId &&
      next.userId === snapshot.currentUserId
    ) {
      return;
    }
    setStaff((current) => {
      const withoutSynthetic = current.filter((item) => item.id !== "primary-doctor");
      const exists = withoutSynthetic.some((item) => item.id === next.id);
      if (exists) {
        return withoutSynthetic.map((item) => (item.id === next.id ? next : item));
      }
      return [...withoutSynthetic, next].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      );
    });
  }, [snapshot.currentUserId]);

  const onStaffRemove = useCallback((staffId: string) => {
    setStaff((current) => current.filter((item) => item.id !== staffId));
  }, []);

  useTeamOpsRealtime({
    tenantId: snapshot.tenantId,
    onAppointmentUpsert,
    onAppointmentRemove,
    onStaffUpsert,
    onStaffRemove,
  });

  const filtered = useMemo(
    () =>
      filterMembers(members, {
        query,
        role,
        status,
        overview: overviewFilter,
      }),
    [members, query, role, status, overviewFilter],
  );

  const onStatusChanged = useCallback((memberId: string, next: TeamLiveStatus) => {
    setStaff((current) =>
      current.map((m) =>
        m.id === memberId
          ? {
              ...m,
              availability:
                next === "in_session" || next === "busy"
                  ? "busy"
                  : next === "break"
                    ? "break"
                    : next === "offline" || next === "on_leave"
                      ? "offline"
                      : "available",
              statusChangedAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const assignMember = assignForId ? members.find((m) => m.id === assignForId) : null;
  const transferMember = transferForId ? members.find((m) => m.id === transferForId) : null;
  const profileMember = profileForId ? members.find((m) => m.id === profileForId) : null;

  const showEmptyRoster = staff.length === 0;
  const showFilteredEmpty = !showEmptyRoster && filtered.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-10">
      <TeamOpsHeader
        query={query}
        onQueryChange={setQuery}
        role={role}
        onRoleChange={setRole}
        status={status}
        onStatusChange={setStatus}
        canManage={snapshot.canManageClinic}
        onInvite={() => setInviteOpen(true)}
      />

      <OperationsOverview
        overview={overview}
        active={overviewFilter}
        onSelect={setOverviewFilter}
      />

      <OpsInsightsStrip
        insights={insights}
        onFocusMember={(id) => {
          setFocusId(id);
          setOverviewFilter("all");
          setRole("all");
          setStatus("all");
          setQuery("");
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Team board" className="min-w-0">
          {showEmptyRoster ? (
            <TeamEmptyState
              canManage={snapshot.canManageClinic}
              onInvite={() => setInviteOpen(true)}
            />
          ) : showFilteredEmpty ? (
            <TeamEmptyState
              canManage={snapshot.canManageClinic}
              onInvite={() => setInviteOpen(true)}
              filtered
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((member) => (
                <div
                  key={member.id}
                  className={
                    focusId === member.id
                      ? "rounded-2xl ring-2 ring-accent/40 ring-offset-2 ring-offset-base"
                      : undefined
                  }
                >
                  <TeamMemberCard
                    member={member}
                    canManage={snapshot.canManageClinic}
                    onStatusChanged={onStatusChanged}
                    onAssignPatient={setAssignForId}
                    onTransferPatient={setTransferForId}
                    onOpenProfile={setProfileForId}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <LiveActivityRail events={activity} />
        </div>
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={() => router.refresh()}
      />

      {assignMember ? (
        <AssignPatientSheet
          open
          staffId={assignMember.id}
          staffName={assignMember.displayName}
          appointments={appointments}
          onClose={() => setAssignForId(null)}
          onAssigned={onAppointmentUpsert}
        />
      ) : null}

      {transferMember ? (
        <TransferPatientSheet
          open
          fromMember={transferMember}
          members={members}
          appointments={appointments}
          onClose={() => setTransferForId(null)}
          onTransferred={(appt, toStaffId, toStaffName) => {
            onAppointmentUpsert({
              ...appt,
              assignedStaffId: toStaffId,
              assignedStaffName: toStaffName,
            });
          }}
        />
      ) : null}

      <MemberProfileDrawer
        member={profileMember ?? null}
        canManage={snapshot.canManageRoles}
        currentUserId={snapshot.currentUserId}
        onClose={() => setProfileForId(null)}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}
