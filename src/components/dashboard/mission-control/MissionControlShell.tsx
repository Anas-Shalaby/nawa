"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGroup } from "framer-motion";
import type { DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import { useNotifications } from "@/components/providers/NotificationsContext";
import { useAppointmentsRealtime } from "@/lib/dashboard/useAppointmentsRealtime";
import { useOptimisticAppointments } from "@/lib/dashboard/useOptimisticAppointments";
import {
  buildAttentionItems,
  buildInsights,
  computeMissionControlMetrics,
  statusForZone,
  zoneForStatus,
} from "@/lib/dashboard/missionControlSelectors";
import type {
  Appointment,
  AppointmentStatus,
  MissionControlSnapshot,
} from "@/lib/dashboard/types";
import { formatCairoDateShort } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";
import { MissionControlNowProvider } from "./MissionControlNowProvider";
import { MissionControlSummaryBar } from "./MissionControlSummaryBar";
import { QuickOpsPanel } from "./QuickOpsPanel";
import { LiveFloorBoard } from "./LiveFloorBoard";
import { ClinicRadarPanel } from "./ClinicRadarPanel";

type MobileSection = "ops" | "floor" | "radar";

interface MissionControlShellProps extends MissionControlSnapshot {}

export function MissionControlShell({
  clinicName,
  doctorName,
  date,
  tenantId,
  appointments: initialAppointments,
  metrics: initialMetrics,
  canViewRevenue,
  canManageQueue,
  canCreateWalkIn,
  services,
  pendingTomorrowCount,
  todayPayments: initialPayments,
  yesterdayUnpaid,
  rooms: initialRooms,
  doctors: initialDoctors,
  attentionItems: initialAttention,
  insights: initialInsights,
}: MissionControlShellProps) {
  const t = useTranslations("dashboard.commandCenter");
  const locale = useLocale() as Locale;
  const { unreadCount } = useNotifications();
  const [sourceAppointments, setSourceAppointments] = useState(initialAppointments);
  const { appointments, applyOptimistic, isPending } = useOptimisticAppointments(
    sourceAppointments,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [doctorGlow, setDoctorGlow] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileSection>("floor");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [, startTransition] = useTransition();
  const pendingTransitionRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSourceAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    if (!doctorGlow) return;
    const timer = window.setTimeout(() => setDoctorGlow(false), 900);
    return () => window.clearTimeout(timer);
  }, [doctorGlow]);

  const onUpsert = useCallback(
    (appointment: Appointment) => {
      if (pendingTransitionRef.current.has(appointment.id)) return;
      setSourceAppointments((current) => {
        const exists = current.some((item) => item.id === appointment.id);
        if (exists) {
          return current.map((item) =>
            item.id === appointment.id ? appointment : item,
          );
        }
        return [...current, appointment].sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
        );
      });
      setLiveAnnouncement(
        t("liveUpdate", { name: appointment.patientName, status: appointment.status }),
      );
    },
    [t],
  );

  const onRemove = useCallback((appointmentId: string) => {
    if (pendingTransitionRef.current.has(appointmentId)) return;
    setSourceAppointments((current) =>
      current.filter((item) => item.id !== appointmentId),
    );
  }, []);

  useAppointmentsRealtime({ tenantId, onUpsert, onRemove });

  const metrics = useMemo(() => {
    const live = computeMissionControlMetrics(
      appointments,
      Date.now(),
      canViewRevenue ? initialMetrics.todayRevenueEgp : undefined,
    );
    live.doctorsTotal = initialDoctors.length;
    live.doctorsAvailable = initialDoctors.filter(
      (doctor) => doctor.availability === "available",
    ).length;
    live.capacityPct = live.totalToday === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            ((live.waitingNow + live.inSession + live.completed) / live.totalToday) * 100,
          ),
        );
    return live;
  }, [appointments, canViewRevenue, initialMetrics.todayRevenueEgp, initialDoctors]);

  const serviceFrequency = useMemo(() => {
    const map = new Map<string, number>();
    for (const appointment of appointments) {
      map.set(appointment.serviceName, (map.get(appointment.serviceName) ?? 0) + 1);
    }
    return map;
  }, [appointments]);

  const attentionItems = useMemo(
    () =>
      buildAttentionItems(
        appointments,
        pendingTomorrowCount,
        canViewRevenue,
      ),
    [appointments, pendingTomorrowCount, canViewRevenue],
  );

  const insights = useMemo(
    () => buildInsights(appointments, metrics, serviceFrequency),
    [appointments, metrics, serviceFrequency],
  );

  const rooms = useMemo(() => {
    const inSession = appointments.filter((item) => item.status === "in_session");
    if (initialRooms.length > 0) {
      return initialRooms.map((room) => {
        const occupant =
          inSession.find((item) => item.roomId === room.id) ??
          (room.id === "room-1" ? inSession[0] : room.id === "room-2" ? inSession[1] : null);
        return {
          ...room,
          busy: Boolean(occupant),
          detail: occupant?.serviceName ?? "",
          currentPatientName: occupant?.patientName ?? null,
          currentAppointmentId: occupant?.id ?? null,
        };
      });
    }
    return initialRooms;
  }, [appointments, initialRooms]);

  const persistStatus = useCallback(
    (appointment: Appointment, status: AppointmentStatus) => {
      if (!canManageQueue || pendingId) return;
      const snapshot = sourceAppointments;
      pendingTransitionRef.current.add(appointment.id);
      setPendingId(appointment.id);
      applyOptimistic({ type: "move", id: appointment.id, status });

      if (status === "in_session") setDoctorGlow(true);

      startTransition(async () => {
        const result = await updateAppointmentStatus(appointment.id, status);
        pendingTransitionRef.current.delete(appointment.id);
        if (!result.success) {
          setSourceAppointments(snapshot);
          toast.error(result.error ?? t("actionError"));
        } else {
          setSourceAppointments((current) =>
            current.map((item) =>
              item.id === appointment.id ? { ...item, status } : item,
            ),
          );
          setLiveAnnouncement(
            t("liveUpdate", { name: appointment.patientName, status }),
          );
        }
        setPendingId(null);
      });
    },
    [applyOptimistic, canManageQueue, pendingId, sourceAppointments, t],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) return;

      const appointment = appointments.find((item) => item.id === draggableId);
      if (!appointment) return;

      const toZone = destination.droppableId as "outside" | "waiting" | "doctor";
      const nextStatus = statusForZone(toZone, appointment.status);
      if (nextStatus === appointment.status) return;
      persistStatus(appointment, nextStatus);
    },
    [appointments, persistStatus],
  );

  const onWalkInAdded = useCallback((appointment: Appointment) => {
    setSourceAppointments((current) =>
      [...current, appointment].sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
      ),
    );
    applyOptimistic({ type: "add", appointment });
  }, [applyOptimistic]);

  const numberLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const dateLabel = formatCairoDateShort(date, locale);
  const unpaidCount = canViewRevenue ? yesterdayUnpaid.length : 0;

  const sectionClass = (section: MobileSection) =>
    [
      mobileSection === section ? "flex" : "hidden",
      "min-h-0 flex-col lg:flex",
    ].join(" ");

  return (
    <MissionControlNowProvider>
      <LayoutGroup>
        <div
          className="flex h-full w-full flex-col overflow-y-auto bg-base lg:overflow-hidden"
          data-tenant-id={tenantId}
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {liveAnnouncement}
          </div>

          <MissionControlSummaryBar
            metrics={metrics}
            canViewRevenue={canViewRevenue}
            onFocusWaiting={() => setMobileSection("floor")}
            onFocusRemaining={() => setMobileSection("floor")}
            onFocusDoctors={() => setMobileSection("radar")}
          />

          <div className="mb-2 flex gap-1 lg:hidden">
            {(["ops", "floor", "radar"] as MobileSection[]).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setMobileSection(section)}
                className={[
                  "min-h-11 flex-1 rounded-xl border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  mobileSection === section
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-subtle bg-surface text-muted",
                ].join(" ")}
              >
                {t(`mobile.${section}`)}
              </button>
            ))}
          </div>

          <div
            className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:overflow-hidden"
            aria-busy={isPending || Boolean(pendingId)}
          >
            <div className={`${sectionClass("ops")} lg:col-span-3`}>
              <QuickOpsPanel
                clinicName={clinicName}
                dateLabel={dateLabel}
                services={services}
                canViewRevenue={canViewRevenue}
                canCreateWalkIn={canCreateWalkIn}
                canManageQueue={canManageQueue}
                pendingTomorrowCount={pendingTomorrowCount}
                yesterdayUnpaid={yesterdayUnpaid}
                attentionItems={attentionItems}
                unreadCount={unreadCount}
                onWalkInAdded={onWalkInAdded}
              />
            </div>

            <div className={`${sectionClass("floor")} lg:col-span-6`}>
              <LiveFloorBoard
                appointments={appointments}
                totalToday={metrics.totalToday}
                pendingId={pendingId}
                locale={locale}
                doctorGlow={doctorGlow}
                canManageQueue={canManageQueue}
                canViewRevenue={canViewRevenue}
                pendingTomorrowCount={pendingTomorrowCount}
                unpaidCount={unpaidCount}
                onDragEnd={onDragEnd}
                onStatusChange={persistStatus}
              />
            </div>

            <div className={`${sectionClass("radar")} lg:col-span-3`}>
              <ClinicRadarPanel
                rooms={rooms}
                doctors={initialDoctors}
                metrics={metrics}
                canViewRevenue={canViewRevenue}
                todayPayments={initialPayments}
                yesterdayUnpaid={yesterdayUnpaid}
                attentionItems={[...attentionItems, ...initialAttention].slice(0, 12)}
                insights={insights.length > 0 ? insights : initialInsights}
                numberLocale={numberLocale}
              />
            </div>
          </div>
        </div>
      </LayoutGroup>
    </MissionControlNowProvider>
  );
}
