"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  markAppointmentNoShow,
  updateAppointmentStatus,
} from "@/actions/updateAppointmentStatus";
import { useAppointmentsRealtime } from "@/lib/dashboard/useAppointmentsRealtime";
import { useOptimisticAppointments } from "@/lib/dashboard/useOptimisticAppointments";
import { isAppointmentOnCairoDate } from "@/lib/datetime/cairo";
import { isQueueVisible } from "@/lib/dashboard/queueStateMachine";
import type { Appointment, AppointmentStatus, DashboardService, QueueAppointment } from "@/lib/dashboard/types";
import { AppointmentDetailPanel } from "./AppointmentDetailPanel";
import { SmartQueue } from "./SmartQueue";

interface SmartQueueBoardProps {
  appointments: Appointment[];
  tenantId: string;
  services: DashboardService[];
  onAppointmentsChange: Dispatch<SetStateAction<Appointment[]>>;
  onNoShowMarked: () => void;
  onRealtimeUpsert: (appointment: Appointment) => void;
  onRealtimeRemove: (appointmentId: string) => void;
}

export function SmartQueueBoard({
  appointments: sourceAppointments,
  tenantId,
  services,
  onAppointmentsChange,
  onNoShowMarked,
  onRealtimeUpsert,
  onRealtimeRemove,
}: SmartQueueBoardProps) {
  const pendingTransitionRef = useRef<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noShowPendingId, setNoShowPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { appointments, applyOptimistic, isPending } =
    useOptimisticAppointments(sourceAppointments);

  const visibleAppointments = useMemo(
    () =>
      appointments.filter((item): item is QueueAppointment => {
        if (!isQueueVisible(item.status)) return false;
        if (item.status === "completed") return false;
        if (!isAppointmentOnCairoDate(item.appointmentDate)) return false;
        return true;
      }),
    [appointments],
  );

  const selectedAppointment = useMemo(
    () => visibleAppointments.find((item) => item.id === selectedId) ?? null,
    [visibleAppointments, selectedId],
  );

  const handleRealtimeUpsert = useCallback(
    (appointment: Appointment) => {
      if (pendingTransitionRef.current.has(appointment.id)) return;
      onRealtimeUpsert(appointment);
    },
    [onRealtimeUpsert],
  );

  const handleRealtimeRemove = useCallback(
    (appointmentId: string) => {
      if (pendingTransitionRef.current.has(appointmentId)) return;
      onRealtimeRemove(appointmentId);
      setSelectedId((current) => (current === appointmentId ? null : current));
    },
    [onRealtimeRemove],
  );

  useAppointmentsRealtime({
    tenantId,
    onUpsert: handleRealtimeUpsert,
    onRemove: handleRealtimeRemove,
  });

  const handleSelect = useCallback((appointment: QueueAppointment) => {
    setSelectedId(appointment.id);
  }, []);

  const handleNoShow = useCallback(
    (appointment: QueueAppointment) => {
      setNoShowPendingId(appointment.id);
      pendingTransitionRef.current.add(appointment.id);

      applyOptimistic({ type: "remove", id: appointment.id });

      startTransition(async () => {
        const result = await markAppointmentNoShow(
          appointment.id,
          appointment.patientId,
        );

        pendingTransitionRef.current.delete(appointment.id);

        if (result.success) {
          onAppointmentsChange((prev) => prev.filter((item) => item.id !== appointment.id));
          onNoShowMarked();
          setSelectedId((current) => (current === appointment.id ? null : current));
        }

        setNoShowPendingId(null);
      });
    },
    [applyOptimistic, onAppointmentsChange, onNoShowMarked],
  );

  const handleStatusChange = useCallback(
    (appointment: QueueAppointment, newStatus: AppointmentStatus) => {
      if (newStatus === appointment.status) return;

      if (newStatus === "no_show") {
        handleNoShow(appointment);
        return;
      }

      if (!isQueueVisible(newStatus)) return;

      const previousStatus = appointment.status;
      pendingTransitionRef.current.add(appointment.id);
      setUpdatingId(appointment.id);

      applyOptimistic({ type: "move", id: appointment.id, status: newStatus });

      startTransition(async () => {
        const result = await updateAppointmentStatus(appointment.id, newStatus);

        pendingTransitionRef.current.delete(appointment.id);
        setUpdatingId(null);

        if (result.success) {
          onAppointmentsChange((prev) =>
            prev.map((item) =>
              item.id === appointment.id ? { ...item, status: newStatus } : item,
            ),
          );
          if (newStatus === "completed") {
            setSelectedId((current) => (current === appointment.id ? null : current));
          }
        } else {
          onAppointmentsChange((prev) =>
            prev.map((item) =>
              item.id === appointment.id ? { ...item, status: previousStatus } : item,
            ),
          );
        }
      });
    },
    [applyOptimistic, handleNoShow, onAppointmentsChange],
  );

  return (
    <div
      className="flex h-full w-full min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch"
      data-tenant-id={tenantId}
      aria-busy={isPending}
    >
      <div className="order-2 flex min-h-[48vh] w-full min-w-0 flex-[1.05] basis-0 lg:order-1 lg:min-h-0 rtl:lg:order-2">
        <AppointmentDetailPanel
          appointment={selectedAppointment}
          tenantId={tenantId}
          services={services}
          isNoShowPending={noShowPendingId === selectedId}
          isUpdatingStatus={updatingId === selectedId}
          onNoShow={handleNoShow}
          onStatusChange={handleStatusChange}
        />
      </div>

      <div className="order-1 flex min-h-[48vh] w-full min-w-0 flex-[0.95] basis-0 lg:order-2 lg:min-h-0 rtl:lg:order-1">
        <SmartQueue
          appointments={visibleAppointments}
          selectedId={selectedId}
          updatingId={updatingId}
          onSelect={handleSelect}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
