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
import { useAppointmentsRealtime } from "@/lib/dashboard/useAppointmentsRealtime";
import { useOptimisticAppointments } from "@/lib/dashboard/useOptimisticAppointments";
import {
  buildAttentionItems,
  computeMissionControlMetrics,
  statusForZone,
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
import { AttentionCenter } from "./AttentionCenter";

type MobileSection = "ops" | "floor" | "alerts";

interface MissionControlShellProps extends MissionControlSnapshot {}

function suggestNext(appointments: Appointment[]): Appointment | null {
  return (
    appointments.find((item) => item.status === "checked_in") ??
    appointments.find(
      (item) => item.status === "pending" || item.status === "confirmed",
    ) ??
    null
  );
}

export function MissionControlShell({
  clinicName,
  date,
  tenantId,
  appointments: initialAppointments,
  metrics: initialMetrics,
  canViewRevenue,
  canManageQueue,
  canCreateWalkIn,
  services,
  pendingTomorrowCount,
  yesterdayUnpaid,
  doctors: initialDoctors,
}: MissionControlShellProps) {
  const t = useTranslations("dashboard.commandCenter");
  const locale = useLocale() as Locale;
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
    live.capacityPct =
      live.totalToday === 0
        ? 0
        : Math.min(
            100,
            Math.round(
              ((live.waitingNow + live.inSession + live.completed) / live.totalToday) *
                100,
            ),
          );
    return live;
  }, [appointments, canViewRevenue, initialMetrics.todayRevenueEgp, initialDoctors]);

  const attentionItems = useMemo(
    () =>
      buildAttentionItems(appointments, pendingTomorrowCount, canViewRevenue).slice(
        0,
        3,
      ),
    [appointments, pendingTomorrowCount, canViewRevenue],
  );

  const nextPatient = useMemo(() => suggestNext(appointments), [appointments]);

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

  const onWalkInAdded = useCallback(
    (appointment: Appointment) => {
      setSourceAppointments((current) =>
        [...current, appointment].sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
        ),
      );
      applyOptimistic({ type: "add", appointment });
    },
    [applyOptimistic],
  );

  const dateLabel = formatCairoDateShort(date, locale);
  const unpaidCount = canViewRevenue ? yesterdayUnpaid.length : 0;

  const sectionClass = (section: MobileSection) =>
    [mobileSection === section ? "flex" : "hidden", "min-h-0 flex-col lg:flex"].join(
      " ",
    );

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

          <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted">{clinicName}</p>
              <h1 className="text-xl font-semibold tracking-tight text-primary">
                {t("floorPageTitle")}
              </h1>
              <p className="text-xs text-muted">{dateLabel}</p>
              <p className="mt-1 text-sm text-muted">{t("floorPageSubtitle")}</p>
            </div>
          </header>

          <MissionControlSummaryBar
            metrics={metrics}
            canViewRevenue={false}
            compact
            onFocusWaiting={() => setMobileSection("floor")}
          />

          <div className="mb-2 flex gap-1 lg:hidden">
            {(["ops", "floor", "alerts"] as MobileSection[]).map((section) => (
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
                attentionItems={[]}
                unreadCount={0}
                onWalkInAdded={onWalkInAdded}
                compact
              />
            </div>

            <div className={`${sectionClass("floor")} lg:col-span-6 xl:col-span-7`}>
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

            <div className={`${sectionClass("alerts")} lg:col-span-3 xl:col-span-2`}>
              <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-subtle bg-surface p-4 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("next.title")}
                  </h2>
                  {nextPatient ? (
                    <div className="rounded-xl border border-subtle bg-elevated/40 p-3">
                      <p className="truncate text-sm font-semibold text-primary">
                        {nextPatient.patientName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {nextPatient.serviceName}
                      </p>
                      {canManageQueue ? (
                        <button
                          type="button"
                          disabled={Boolean(pendingId)}
                          onClick={() =>
                            persistStatus(
                              nextPatient,
                              nextPatient.status === "checked_in"
                                ? "in_session"
                                : "checked_in",
                            )
                          }
                          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
                        >
                          {nextPatient.status === "checked_in"
                            ? t("next.start")
                            : t("next.checkIn")}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-subtle px-3 py-6 text-center text-xs text-muted">
                      {t("next.empty")}
                    </p>
                  )}
                </section>

                <section>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("attention.title")}
                  </h2>
                  {attentionItems.length > 0 ? (
                    <AttentionCenter items={attentionItems} compact />
                  ) : (
                    <p className="text-xs text-muted">{t("ops.noUrgent")}</p>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </div>
      </LayoutGroup>
    </MissionControlNowProvider>
  );
}
