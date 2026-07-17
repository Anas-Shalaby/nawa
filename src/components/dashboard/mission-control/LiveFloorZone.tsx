"use client";

import { useTranslations } from "next-intl";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { Appointment, AppointmentStatus, FloorZone } from "@/lib/dashboard/types";
import {
  minutesBetween,
  sessionStartMs,
  waitingStartMs,
} from "@/lib/dashboard/missionControlSelectors";
import { useMissionControlNow } from "./MissionControlNowProvider";
import { PatientOpsCard } from "./PatientOpsCard";
import type { Locale } from "@/i18n/routing";

interface LiveFloorZoneProps {
  zone: FloorZone;
  items: Appointment[];
  pendingId: string | null;
  locale: Locale;
  doctorGlow?: boolean;
  canManageQueue: boolean;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
}

export function LiveFloorZone({
  zone,
  items,
  pendingId,
  locale,
  doctorGlow = false,
  canManageQueue,
  onStatusChange,
}: LiveFloorZoneProps) {
  const t = useTranslations("dashboard.commandCenter.floor");
  const now = useMissionControlNow();
  const isDoctor = zone === "doctor";

  return (
    <div
      className={[
        "flex min-h-[12rem] flex-col rounded-xl border p-2 lg:min-h-0",
        isDoctor ? "border-accent/25 bg-accent/5" : "border-subtle bg-elevated/50",
        isDoctor && doctorGlow ? "ring-2 ring-accent/40" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-1">
        <h3 className="text-[11px] font-semibold text-primary">{t(`zones.${zone}`)}</h3>
        <span className="text-[10px] text-muted">{items.length}</span>
      </div>
      <Droppable droppableId={zone} isDropDisabled={!canManageQueue}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={[
              "min-h-[8rem] flex-1 space-y-2 overflow-y-auto rounded-lg p-0.5 transition-colors lg:min-h-0",
              snapshot.isDraggingOver ? "bg-accent/10" : "",
            ].join(" ")}
          >
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-subtle px-2 py-8 text-center text-[10px] text-muted">
                {t("zoneEmpty")}
              </p>
            ) : null}
            {items.map((appointment, index) => {
              const waitMinutes = minutesBetween(waitingStartMs(appointment), now);
              const consultMinutes = minutesBetween(sessionStartMs(appointment), now);
              const busy = pendingId === appointment.id;

              return (
                <Draggable
                  key={appointment.id}
                  draggableId={appointment.id}
                  index={index}
                  isDragDisabled={!canManageQueue || busy}
                >
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                    >
                      <PatientOpsCard
                        appointment={appointment}
                        zone={zone}
                        waitMinutes={waitMinutes}
                        consultMinutes={consultMinutes}
                        busy={busy}
                        locale={locale}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={dragSnapshot.isDragging}
                        canManageQueue={canManageQueue}
                        onStatusChange={(status) => onStatusChange(appointment, status)}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            {items.length > 12 ? (
              <p className="text-center text-[10px] text-muted">
                {t("overflow", { count: items.length - 12 })}
              </p>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
