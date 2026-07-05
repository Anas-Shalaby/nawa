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
import { NEXT_QUEUE_STATUS, isQueueVisible } from "@/lib/dashboard/queueStateMachine";
import type { Appointment, DashboardService, QueueAppointment } from "@/lib/dashboard/types";
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
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [noShowPendingId, setNoShowPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { appointments, applyOptimistic, isPending } =
    useOptimisticAppointments(sourceAppointments);

  const visibleAppointments = useMemo(
    () =>
      appointments.filter((item): item is QueueAppointment => {
        if (!isQueueVisible(item.status)) return false;
        if (item.status === "completed") return false;
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

  const handleAdvance = useCallback(
    (appointment: QueueAppointment) => {
      const nextStatus = NEXT_QUEUE_STATUS[appointment.status];
      if (!nextStatus) return;

      const previousStatus = appointment.status;
      pendingTransitionRef.current.add(appointment.id);
      setAdvancingId(appointment.id);

      applyOptimistic({ type: "move", id: appointment.id, status: nextStatus });

      startTransition(async () => {
        const result = await updateAppointmentStatus(appointment.id, nextStatus);

        pendingTransitionRef.current.delete(appointment.id);
        setAdvancingId(null);

        if (result.success) {
          onAppointmentsChange((prev) =>
            prev.map((item) =>
              item.id === appointment.id ? { ...item, status: nextStatus } : item,
            ),
          );
          if (nextStatus === "completed") {
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
    [applyOptimistic, onAppointmentsChange],
  );

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

  return (
    <div
      className="flex flex-col gap-6 md:flex-row md:items-stretch"
      data-tenant-id={tenantId}
      aria-busy={isPending}
    >
      <div className="min-w-0 md:order-1 md:flex-[3] rtl:md:order-2">
        <AppointmentDetailPanel
          appointment={selectedAppointment}
          tenantId={tenantId}
          services={services}
          isNoShowPending={noShowPendingId === selectedId}
          onNoShow={handleNoShow}
        />
      </div>

      <div className="min-w-0 md:order-2 md:flex-[2] rtl:md:order-1">
        <SmartQueue
          appointments={visibleAppointments}
          selectedId={selectedId}
          advancingId={advancingId}
          onSelect={handleSelect}
          onAdvance={handleAdvance}
        />
      </div>
    </div>
  );
}
