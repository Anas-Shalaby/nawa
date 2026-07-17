"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import type { Appointment, AppointmentStatus } from "@/lib/dashboard/types";
import {
  deriveFloorColumns,
  ZONE_ORDER,
} from "@/lib/dashboard/missionControlSelectors";
import { LiveFloorZone } from "./LiveFloorZone";
import type { Locale } from "@/i18n/routing";

interface LiveFloorBoardProps {
  appointments: Appointment[];
  totalToday: number;
  pendingId: string | null;
  locale: Locale;
  doctorGlow: boolean;
  canManageQueue: boolean;
  canViewRevenue: boolean;
  pendingTomorrowCount: number;
  unpaidCount: number;
  onDragEnd: (result: DropResult) => void;
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void;
}

function DailyChecklist({
  pendingTomorrowCount,
  unpaidCount,
  canViewRevenue,
}: {
  pendingTomorrowCount: number;
  unpaidCount: number;
  canViewRevenue: boolean;
}) {
  const t = useTranslations("dashboard.commandCenter.floor");
  const items = [
    t("checklist.empty"),
    t("checklist.cashDrawer"),
    t("checklist.callTomorrow", { count: Math.max(pendingTomorrowCount, 0) }),
    ...(canViewRevenue ? [t("checklist.unpaid", { count: unpaidCount })] : []),
  ];

  return (
    <div className="flex min-h-[16rem] flex-1 flex-col justify-center overflow-y-auto rounded-xl border border-dashed border-subtle bg-elevated/30 p-4 lg:min-h-0">
      <p className="mb-3 text-sm font-semibold text-primary">{t("checklistTitle")}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 rounded-lg border border-subtle bg-surface px-3 py-2 text-xs text-primary"
          >
            <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-subtle bg-elevated" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LiveFloorBoard({
  appointments,
  totalToday,
  pendingId,
  locale,
  doctorGlow,
  canManageQueue,
  canViewRevenue,
  pendingTomorrowCount,
  unpaidCount,
  onDragEnd,
  onStatusChange,
}: LiveFloorBoardProps) {
  const t = useTranslations("dashboard.commandCenter.floor");
  const columns = useMemo(() => deriveFloorColumns(appointments), [appointments]);
  const activeCount = columns.outside.length + columns.waiting.length + columns.doctor.length;
  const floorEmpty = activeCount === 0;

  return (
    <section
      className="flex min-h-0 flex-col rounded-2xl border border-subtle bg-surface p-3 lg:max-h-[calc(100vh-10rem)]"
      aria-live="polite"
      aria-busy={Boolean(pendingId)}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-primary">{t("title")}</h2>
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-muted">
          {t("count", { active: activeCount, total: totalToday })}
        </span>
      </div>

      {floorEmpty ? (
        <DailyChecklist
          pendingTomorrowCount={pendingTomorrowCount}
          unpaidCount={unpaidCount}
          canViewRevenue={canViewRevenue}
        />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-3 lg:overflow-hidden">
            {ZONE_ORDER.map((zone) => (
              <LiveFloorZone
                key={zone}
                zone={zone}
                items={columns[zone]}
                pendingId={pendingId}
                locale={locale}
                doctorGlow={doctorGlow && zone === "doctor"}
                canManageQueue={canManageQueue}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </DragDropContext>
      )}
    </section>
  );
}
