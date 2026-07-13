"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { GripVertical, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { addWalkIn } from "@/actions/addWalkIn";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import {
  createPatientBookingSchema,
  type PatientBookingFormValues,
} from "@/lib/booking/schema";
import type { DailyMiniStats } from "@/lib/dashboard/miniStats";
import type {
  Appointment,
  AppointmentStatus,
  ClinicRoomStatus,
  DashboardService,
  PaymentTickerItem,
  UnpaidCollectItem,
} from "@/lib/dashboard/types";
import { formatCairoDateShort } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";

type FloorZone = "outside" | "waiting" | "doctor";

interface DashboardShellProps {
  clinicName: string;
  doctorName: string;
  date: string;
  tenantId: string;
  initialAppointments: Appointment[];
  initialMiniStats: DailyMiniStats;
  canViewRevenue: boolean;
  services: DashboardService[];
  pendingTomorrowCount: number;
  todayPayments: PaymentTickerItem[];
  yesterdayUnpaid: UnpaidCollectItem[];
  rooms: ClinicRoomStatus[];
  capacityPct: number;
}

const ZONE_ORDER: FloorZone[] = ["outside", "waiting", "doctor"];

function statusForZone(
  zone: FloorZone,
  previous: AppointmentStatus,
): AppointmentStatus {
  if (zone === "outside") {
    return previous === "pending" ? "pending" : "confirmed";
  }
  if (zone === "waiting") return "checked_in";
  return "in_session";
}

function zoneForStatus(status: AppointmentStatus): FloorZone | null {
  if (status === "pending" || status === "confirmed") return "outside";
  if (status === "checked_in") return "waiting";
  if (status === "in_session") return "doctor";
  return null;
}

function minutesBetween(fromMs: number, to = Date.now()): number {
  if (!Number.isFinite(fromMs)) return 0;
  return Math.max(0, Math.floor((to - fromMs) / 60_000));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function statusPillClass(status: AppointmentStatus): string {
  if (status === "pending") return "bg-status-pending/15 text-status-pending";
  if (status === "confirmed") return "bg-status-confirmed/15 text-status-confirmed";
  if (status === "checked_in") return "bg-status-checkedIn/15 text-status-checkedIn";
  if (status === "in_session") return "bg-status-in_session/15 text-status-in_session";
  return "bg-subtle text-muted";
}

export function DashboardShell({
  clinicName,
  doctorName,
  date,
  tenantId,
  initialAppointments,
  initialMiniStats,
  canViewRevenue,
  services,
  pendingTomorrowCount,
  todayPayments,
  yesterdayUnpaid,
  rooms: initialRooms,
  capacityPct,
}: DashboardShellProps) {
  const t = useTranslations("dashboard.commandCenter");
  const tv = useTranslations("validation");
  const locale = useLocale() as Locale;
  const [appointments, setAppointments] = useState(initialAppointments);
  const [zoneEnteredAt, setZoneEnteredAt] = useState<Record<string, number>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [doctorGlow, setDoctorGlow] = useState(false);
  const [, startTransition] = useTransition();
  const [walkInPending, startWalkIn] = useTransition();

  const schema = useMemo(() => createPatientBookingSchema((key) => tv(key)), [tv]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientBookingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      whatsapp: "",
    },
  });

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [walkInError, setWalkInError] = useState<string | null>(null);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!doctorGlow) return;
    const timer = window.setTimeout(() => setDoctorGlow(false), 900);
    return () => window.clearTimeout(timer);
  }, [doctorGlow]);

  const boardAppointments = useMemo(
    () =>
      appointments
        .filter((item) => zoneForStatus(item.status) !== null)
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
    [appointments],
  );

  const columns = useMemo(() => {
    const map: Record<FloorZone, Appointment[]> = {
      outside: [],
      waiting: [],
      doctor: [],
    };
    for (const item of boardAppointments) {
      const zone = zoneForStatus(item.status);
      if (zone) map[zone].push(item);
    }
    return map;
  }, [boardAppointments]);

  const floorEmpty = boardAppointments.length === 0;

  const rooms = useMemo(() => {
    const inSession = appointments.filter((item) => item.status === "in_session");
    const primary = inSession[0] ?? null;
    const secondary = inSession[1] ?? null;
    const label =
      doctorName.trim().length > 0
        ? doctorName.startsWith("د")
          ? doctorName
          : `د. ${doctorName}`
        : initialRooms[0]?.label ?? clinicName;

    return [
      {
        id: "room-1",
        label,
        busy: Boolean(primary),
        detail: primary
          ? t("radar.busyWith", { service: primary.serviceName })
          : t("radar.available"),
      },
      {
        id: "room-2",
        label: t("radar.procedureRoom"),
        busy: Boolean(secondary),
        detail: secondary
          ? t("radar.busyWith", { service: secondary.serviceName })
          : t("radar.available"),
      },
    ] satisfies ClinicRoomStatus[];
  }, [appointments, clinicName, doctorName, initialRooms, t]);

  const longWaitTasks = useMemo(() => {
    return columns.waiting
      .map((item) => {
        const started =
          zoneEnteredAt[item.id] ?? new Date(item.appointmentDate).getTime();
        return { item, mins: minutesBetween(started, nowTick) };
      })
      .filter((row) => row.mins > 30)
      .sort((a, b) => b.mins - a.mins);
  }, [columns.waiting, zoneEnteredAt, nowTick]);

  const persistStatus = useCallback(
    (appointment: Appointment, status: AppointmentStatus) => {
      if (pendingId) return;
      const snapshot = appointments;
      setPendingId(appointment.id);
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, status } : item,
        ),
      );

      startTransition(async () => {
        const result = await updateAppointmentStatus(appointment.id, status);
        if (!result.success) {
          setAppointments(snapshot);
          toast.error(result.error ?? t("actionError"));
        }
        setPendingId(null);
      });
    },
    [appointments, pendingId, t],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId) return;

      const toZone = destination.droppableId as FloorZone;
      const appointment = appointments.find((item) => item.id === draggableId);
      if (!appointment) return;

      const nextStatus = statusForZone(toZone, appointment.status);
      if (nextStatus === appointment.status) return;

      if (toZone === "waiting" || toZone === "doctor") {
        setZoneEnteredAt((current) => ({ ...current, [draggableId]: Date.now() }));
      }
      if (toZone === "doctor") setDoctorGlow(true);

      persistStatus(appointment, nextStatus);
    },
    [appointments, persistStatus],
  );

  function onWalkIn(values: PatientBookingFormValues) {
    if (!serviceId) {
      setWalkInError(t("ops.serviceRequired"));
      return;
    }
    setWalkInError(null);
    startWalkIn(async () => {
      const result = await addWalkIn({
        name: values.name,
        whatsapp: values.whatsapp,
        serviceId,
      });
      if (!result.success || !result.appointment) {
        setWalkInError(result.error ?? t("ops.walkInError"));
        return;
      }
      setAppointments((current) =>
        [...current, result.appointment!].sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
      );
      setZoneEnteredAt((current) => ({
        ...current,
        [result.appointment!.id]: Date.now(),
      }));
      reset({ name: "", whatsapp: "" });
      toast.success(t("ops.walkInSuccess"));
    });
  }

  const numberLocale = locale === "ar" ? "ar-EG" : "en-EG";

  return (
    <LayoutGroup>
      <div
        dir="rtl"
        className="grid h-[calc(100vh-80px)] grid-cols-1 gap-4 overflow-hidden bg-base lg:grid-cols-12"
        data-tenant-id={tenantId}
      >
        {/* Pane 1 — Quick Ops (RTL right) */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-subtle bg-surface p-3 lg:col-span-3">
          <div className="shrink-0">
            <p className="text-[11px] font-medium text-muted">{clinicName}</p>
            <h1 className="text-sm font-semibold text-primary">{t("title")}</h1>
            <p className="text-[10px] text-muted">
              {formatCairoDateShort(date, locale)}
            </p>
          </div>

          <section className="shrink-0 rounded-xl border border-subtle bg-elevated/60 p-3">
            <h2 className="mb-2 text-xs font-semibold text-primary">
              {t("ops.walkInTitle")}
            </h2>
            <form
              className="space-y-2"
              onSubmit={handleSubmit(onWalkIn)}
            >
              <input
                {...register("name")}
                placeholder={t("ops.name")}
                className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {errors.name ? (
                <p className="text-[10px] text-accent-danger">{errors.name.message}</p>
              ) : null}
              <input
                {...register("whatsapp")}
                placeholder={t("ops.phone")}
                dir="ltr"
                className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-start text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {errors.whatsapp ? (
                <p className="text-[10px] text-accent-danger">
                  {errors.whatsapp.message}
                </p>
              ) : null}
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="h-9 w-full rounded-lg border border-subtle bg-surface px-2.5 text-xs text-primary focus:border-accent focus:outline-none"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {walkInError ? (
                <p className="text-[10px] text-accent-danger">{walkInError}</p>
              ) : null}
              <button
                type="submit"
                disabled={walkInPending || services.length === 0}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {walkInPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                {t("ops.addToQueue")}
              </button>
            </form>
          </section>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-subtle bg-elevated/40 p-3">
            <h2 className="mb-2 shrink-0 text-xs font-semibold text-primary">
              {t("ops.urgentTitle")}
            </h2>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
              {longWaitTasks.map(({ item, mins }) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-accent-warning/40 bg-accent-warning/10 px-2.5 py-2 text-[11px] text-primary"
                >
                  {t("ops.longWait", { name: item.patientName, mins })}
                </div>
              ))}

              {canViewRevenue &&
                yesterdayUnpaid.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/dashboard/patients/${patient.id}`}
                    className="block rounded-lg border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-2 text-[11px] text-primary transition hover:border-accent-danger/50"
                  >
                    <span className="font-semibold text-accent-danger">
                      {t("ops.collectYesterday", {
                        name: patient.name,
                        amount: patient.amountDue.toLocaleString(numberLocale),
                      })}
                    </span>
                  </Link>
                ))}

              {pendingTomorrowCount > 0 ? (
                <div className="rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px] text-primary">
                  {t("ops.callTomorrow", { count: pendingTomorrowCount })}
                </div>
              ) : null}

              {longWaitTasks.length === 0 &&
              yesterdayUnpaid.length === 0 &&
              pendingTomorrowCount === 0 ? (
                <p className="rounded-lg border border-dashed border-subtle px-2 py-6 text-center text-[11px] text-muted">
                  {t("ops.noUrgent")}
                </p>
              ) : null}
            </div>
          </section>
        </aside>

        {/* Pane 2 — Live Floor */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-subtle bg-surface p-3 lg:col-span-6">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-primary">{t("floor.title")}</h2>
            <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-muted">
              {t("floor.count", {
                active: boardAppointments.length,
                total: initialMiniStats.total,
              })}
            </span>
          </div>

          {floorEmpty ? (
            <DailyChecklist
              pendingTomorrowCount={pendingTomorrowCount}
              unpaidCount={yesterdayUnpaid.length}
              canViewRevenue={canViewRevenue}
            />
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 overflow-hidden">
                {ZONE_ORDER.map((zone) => {
                  const items = columns[zone];
                  const isDoctor = zone === "doctor";
                  return (
                    <div
                      key={zone}
                      className={[
                        "flex min-h-0 flex-col overflow-hidden rounded-xl border p-2",
                        isDoctor
                          ? "border-accent/25 bg-accent/5"
                          : "border-subtle bg-elevated/50",
                        isDoctor && doctorGlow
                          ? "ring-2 ring-accent/40 shadow-[0_0_28px_-6px_rgba(108,92,231,0.55)]"
                          : "",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex shrink-0 items-center justify-between gap-1">
                        <h3 className="text-[11px] font-semibold text-primary">
                          {t(`floor.zones.${zone}`)}
                        </h3>
                        <span className="text-[10px] text-muted">{items.length}</span>
                      </div>
                      <Droppable droppableId={zone}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={[
                              "min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-lg p-0.5 transition-colors",
                              snapshot.isDraggingOver ? "bg-accent/10" : "",
                            ].join(" ")}
                          >
                            {items.map((appointment, index) => (
                              <CompactFloorCard
                                key={appointment.id}
                                appointment={appointment}
                                index={index}
                                zone={zone}
                                mins={minutesBetween(
                                  zoneEnteredAt[appointment.id] ??
                                    new Date(appointment.appointmentDate).getTime(),
                                  nowTick,
                                )}
                                busy={pendingId === appointment.id}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </section>

        {/* Pane 3 — Clinic Radar */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-subtle bg-surface p-3 lg:col-span-3">
          <section className="shrink-0 rounded-xl border border-subtle bg-elevated/50 p-3">
            <h2 className="mb-2 text-xs font-semibold text-primary">
              {t("radar.roomsTitle")}
            </h2>
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex items-start gap-2 rounded-lg border border-subtle bg-surface px-2.5 py-2"
                >
                  <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
                    {room.busy ? (
                      <>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-danger opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-danger" />
                      </>
                    ) : (
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-success" />
                    )}
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="truncate text-xs font-semibold text-primary">
                      {room.label}
                    </p>
                    <p
                      className={[
                        "truncate text-[11px]",
                        room.busy ? "text-accent-danger" : "text-accent-success",
                      ].join(" ")}
                    >
                      {room.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-subtle bg-elevated/50 p-3">
            <h2 className="mb-2 shrink-0 text-xs font-semibold text-primary">
              {t("radar.tickerTitle")}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!canViewRevenue ? (
                <p className="px-1 py-6 text-center text-[11px] text-muted">
                  {t("radar.tickerHidden")}
                </p>
              ) : todayPayments.length === 0 ? (
                <p className="px-1 py-6 text-center text-[11px] text-muted">
                  {t("radar.tickerEmpty")}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {todayPayments.map((payment) => (
                      <motion.li
                        key={payment.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28 }}
                        className="rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px]"
                      >
                        <p className="font-semibold text-accent-success">
                          {t("radar.tickerItem", {
                            amount: payment.amountPaid.toLocaleString(numberLocale),
                            name: payment.patientName,
                          })}
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </section>

          <section className="shrink-0 rounded-xl border border-subtle bg-elevated/50 p-3">
            <h2 className="mb-3 text-xs font-semibold text-primary">
              {t("radar.capacityTitle")}
            </h2>
            <CapacityGauge pct={capacityPct} label={t("radar.capacityLabel", { pct: capacityPct })} />
          </section>
        </aside>
      </div>
    </LayoutGroup>
  );
}

function CompactFloorCard({
  appointment,
  index,
  zone,
  mins,
  busy,
}: {
  appointment: Appointment;
  index: number;
  zone: FloorZone;
  mins: number;
  busy: boolean;
}) {
  const t = useTranslations("dashboard.commandCenter");
  const overdue = zone === "waiting" && mins > 30;

  return (
    <Draggable draggableId={appointment.id} index={index} isDragDisabled={busy}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={busy ? "opacity-60" : undefined}
        >
          <motion.article
            layout
            layoutId={`mc-card-${appointment.id}`}
            className={[
              "rounded-lg border bg-surface p-2 shadow-sm transition-shadow",
              "cursor-grab active:cursor-grabbing hover:shadow-md",
              overdue ? "border-accent-danger" : "border-subtle",
              snapshot.isDragging ? "ring-2 ring-accent/30" : "",
            ].join(" ")}
          >
            <div className="flex items-start gap-1.5">
              <div
                {...provided.dragHandleProps}
                className="mt-0.5 shrink-0 text-muted"
                aria-label={t("floor.dragHandle")}
              >
                <GripVertical className="h-3.5 w-3.5" aria-hidden />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent">
                {initials(appointment.patientName)}
              </div>
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-[11px] font-semibold text-primary">
                  {appointment.patientName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span
                    className={[
                      "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                      statusPillClass(appointment.status),
                    ].join(" ")}
                  >
                    {t(`status.${appointment.status}`)}
                  </span>
                  {(zone === "waiting" || zone === "doctor") && (
                    <span
                      className={[
                        "text-[9px]",
                        overdue ? "font-semibold text-accent-danger" : "text-muted",
                      ].join(" ")}
                    >
                      {t("floor.mins", { mins })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      )}
    </Draggable>
  );
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
  const t = useTranslations("dashboard.commandCenter");
  const items = [
    t("floor.checklist.empty"),
    t("floor.checklist.cashDrawer"),
    t("floor.checklist.callTomorrow", { count: Math.max(pendingTomorrowCount, 0) }),
    ...(canViewRevenue
      ? [t("floor.checklist.unpaid", { count: unpaidCount })]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto rounded-xl border border-dashed border-subtle bg-elevated/30 p-4">
      <p className="mb-3 text-sm font-semibold text-primary">{t("floor.checklistTitle")}</p>
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

function CapacityGauge({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = 42;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 58" className="h-16 w-32" aria-hidden>
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-subtle"
        />
        <path
          d="M8 50 A42 42 0 0 1 92 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent transition-[stroke-dashoffset] duration-700"
        />
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="fill-accent text-[16px] font-bold"
        >
          {clamped}%
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] text-muted">{label}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
