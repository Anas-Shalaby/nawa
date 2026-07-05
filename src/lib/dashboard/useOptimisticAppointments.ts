"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import type { Appointment } from "@/lib/dashboard/types";

export type OptimisticAppointmentAction =
  | { type: "move"; id: string; status: Appointment["status"] }
  | { type: "remove"; id: string }
  | { type: "add"; appointment: Appointment };

function reduceAppointments(
  state: Appointment[],
  action: OptimisticAppointmentAction,
): Appointment[] {
  switch (action.type) {
    case "move":
      return state.map((appointment) =>
        appointment.id === action.id
          ? { ...appointment, status: action.status }
          : appointment,
      );
    case "remove":
      return state.filter((appointment) => appointment.id !== action.id);
    case "add":
      if (state.some((appointment) => appointment.id === action.appointment.id)) {
        return state;
      }
      return [...state, action.appointment].sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      );
    default:
      return state;
  }
}

/**
 * useOptimistic-compatible hook for React 18 (mirrors React 19 useOptimistic semantics).
 */
export function useOptimisticAppointments(source: Appointment[]): {
  appointments: Appointment[];
  applyOptimistic: (action: OptimisticAppointmentAction) => void;
  isPending: boolean;
} {
  const [optimisticLayer, setOptimisticLayer] = useState<Appointment[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isPending) {
      setOptimisticLayer(null);
    }
  }, [source, isPending]);

  const applyOptimistic = useCallback(
    (action: OptimisticAppointmentAction) => {
      startTransition(() => {
        setOptimisticLayer((current) =>
          reduceAppointments(current ?? source, action),
        );
      });
    },
    [source],
  );

  return {
    appointments: optimisticLayer ?? source,
    applyOptimistic,
    isPending,
  };
}
