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
import type { DropResult } from "@hello-pangea/dnd";
import { FilePlus2, UserRound, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/actions/updateAppointmentStatus";
import { Link, useRouter } from "@/i18n/navigation";
import { PsychiatryOsDashboard } from "./PsychiatryOsDashboard";
import { MissionControlNowProvider } from "@/components/dashboard/mission-control/MissionControlNowProvider";
import { LiveFloorBoard } from "@/components/dashboard/mission-control/LiveFloorBoard";
import { QuickOpsPanel } from "@/components/dashboard/mission-control/QuickOpsPanel";
import { useAppointmentsRealtime } from "@/lib/dashboard/useAppointmentsRealtime";
import { useOptimisticAppointments } from "@/lib/dashboard/useOptimisticAppointments";
import {
  buildAttentionItems,
  computeMissionControlMetrics,
  minutesBetween,
  sessionStartMs,
  statusForZone,
  waitingStartMs,
  waitSeverity,
} from "@/lib/dashboard/missionControlSelectors";
import type {
  Appointment,
  AppointmentStatus,
  MissionControlSnapshot,
} from "@/lib/dashboard/types";
import {
  formatAppointmentTime,
  formatCairoDateShort,
} from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";

function greetingKey(now = new Date()): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Cairo",
    }).format(now),
  );
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function suggestNext(
  appointments: Appointment[],
  excludeId?: string | null,
): Appointment | null {
  const pool = excludeId
    ? appointments.filter((item) => item.id !== excludeId)
    : appointments;
  return (
    pool.find((item) => item.status === "checked_in") ??
    pool.find(
      (item) => item.status === "pending" || item.status === "confirmed",
    ) ??
    null
  );
}

function PatientHero({
  title,
  appointment,
  locale,
  mode,
  canManageQueue,
  busy,
  onPrimary,
}: {
  title: string;
  appointment: Appointment | null;
  locale: Locale;
  mode: "current" | "next";
  canManageQueue: boolean;
  busy: boolean;
  onPrimary: () => void;
}) {
  const t = useTranslations("dashboard.clinicOs");
  const now = Date.now();

  if (!appointment) {
    return (
      <section className="flex min-h-[12rem] flex-col justify-between rounded-3xl border border-dashed border-subtle bg-surface/60 p-6 text-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
        <p className="mt-6 text-lg text-muted">
          {mode === "current" ? t("currentEmpty") : t("nextEmpty")}
        </p>
      </section>
    );
  }

  const elapsed =
    mode === "current"
      ? minutesBetween(sessionStartMs(appointment), now)
      : minutesBetween(waitingStartMs(appointment), now);
  const severity = mode === "next" ? waitSeverity(elapsed) : "neutral";
  const primaryLabel =
    mode === "current"
      ? t("complete")
      : appointment.status === "checked_in"
        ? t("start")
        : t("checkIn");

  return (
    <section
      className={[
        "flex min-h-[12rem] flex-col justify-between rounded-3xl border bg-surface p-6 text-start shadow-sm",
        mode === "current" ? "border-accent/30" : "border-subtle",
        severity === "danger"
          ? "ring-1 ring-accent-danger/40"
          : severity === "warning"
            ? "ring-1 ring-accent-warning/30"
            : "",
      ].join(" ")}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          {appointment.patientName}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {appointment.serviceName}
          {" · "}
          {formatAppointmentTime(appointment.appointmentDate, locale)}
        </p>
        <p
          className={[
            "mt-2 text-sm tabular-nums",
            severity === "danger"
              ? "font-semibold text-accent-danger"
              : severity === "warning"
                ? "text-accent-warning"
                : "text-muted",
          ].join(" ")}
        >
          {mode === "current"
            ? t("inSessionMins", { mins: elapsed })
            : t("waitingMins", { mins: elapsed })}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {canManageQueue ? (
          <button
            type="button"
            disabled={busy}
            onClick={onPrimary}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:opacity-50"
          >
            {primaryLabel}
          </button>
        ) : null}
        <Link
          href={`/dashboard/patients/${appointment.patientId}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-subtle px-3 text-sm font-medium text-primary transition hover:border-accent/40"
        >
          <UserRound className="h-4 w-4" aria-hidden />
          {t("openChart")}
        </Link>
        {mode === "current" ? (
          <Link
            href={`/dashboard/patients/${appointment.patientId}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-subtle px-3 text-sm font-medium text-primary transition hover:border-accent/40"
          >
            <FilePlus2 className="h-4 w-4" aria-hidden />
            {t("writeRx")}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function ClinicOsShell(props: MissionControlSnapshot) {
  const {
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
    yesterdayUnpaid,
    doctors: initialDoctors,
  } = props;

  const t = useTranslations("dashboard.clinicOs");
  const tc = useTranslations("dashboard.commandCenter");
  const locale = useLocale() as Locale;
  const [sourceAppointments, setSourceAppointments] =
    useState(initialAppointments);
  const { appointments, applyOptimistic, isPending } =
    useOptimisticAppointments(sourceAppointments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [doctorGlow, setDoctorGlow] = useState(false);
  const [showTools, setShowTools] = useState(false);
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
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        );
      });
      setLiveAnnouncement(
        tc("liveUpdate", {
          name: appointment.patientName,
          status: appointment.status,
        }),
      );
    },
    [tc],
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
    return live;
  }, [
    appointments,
    canViewRevenue,
    initialMetrics.todayRevenueEgp,
    initialDoctors,
  ]);

  const currentPatient = useMemo(
    () => appointments.find((item) => item.status === "in_session") ?? null,
    [appointments],
  );
  const nextPatient = useMemo(
    () => suggestNext(appointments, currentPatient?.id),
    [appointments, currentPatient?.id],
  );

  const attentionItems = useMemo(
    () =>
      buildAttentionItems(appointments, pendingTomorrowCount, false).slice(
        0,
        1,
      ),
    [appointments, pendingTomorrowCount],
  );

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
          toast.error(result.error ?? tc("actionError"));
        } else {
          setSourceAppointments((current) =>
            current.map((item) =>
              item.id === appointment.id ? { ...item, status } : item,
            ),
          );
          setLiveAnnouncement(
            tc("liveUpdate", { name: appointment.patientName, status }),
          );
        }
        setPendingId(null);
      });
    },
    [applyOptimistic, canManageQueue, pendingId, sourceAppointments, tc],
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId)
        return;
      const appointment = appointments.find((item) => item.id === draggableId);
      if (!appointment) return;
      const toZone = destination.droppableId as
        | "outside"
        | "waiting"
        | "doctor";
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
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime(),
        ),
      );
      applyOptimistic({ type: "add", appointment });
      setShowTools(false);
    },
    [applyOptimistic],
  );

  const greetingName =
    doctorName.trim().length > 0 ? doctorName.trim() : clinicName;
  const dateLabel = formatCairoDateShort(date, locale);
  const unpaidCount = canViewRevenue ? yesterdayUnpaid.length : 0;

  const isPsychiatry = props.specialty?.toLowerCase().includes("psych") ?? false;
  const router = useRouter();

  if (isPsychiatry) {
    return (
      <MissionControlNowProvider>
        <div data-tenant-id={tenantId} aria-busy={isPending || Boolean(pendingId)}>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {liveAnnouncement}
          </div>
          <PsychiatryOsDashboard
            appointments={appointments}
            clinicName={clinicName}
            doctorName={doctorName}
            dateLabel={dateLabel}
            locale={locale}
            busy={isPending || Boolean(pendingId)}
            onStatusChange={persistStatus}
            onAddWalkIn={() => setShowTools((v) => !v)}
            onSearchClick={() => router.push("/dashboard/patients")}
            onNewPatientClick={() => router.push("/dashboard/patients")}
          />
          {showTools ? (
            <div className="mx-auto max-w-md mt-4 text-start">
              <QuickOpsPanel
                clinicName={clinicName}
                dateLabel={dateLabel}
                services={services}
                canViewRevenue={false}
                canCreateWalkIn={canCreateWalkIn}
                canManageQueue={canManageQueue}
                pendingTomorrowCount={0}
                yesterdayUnpaid={[]}
                attentionItems={[]}
                unreadCount={0}
                onWalkInAdded={onWalkInAdded}
                compact
              />
            </div>
          ) : null}
        </div>
      </MissionControlNowProvider>
    );
  }

  return (
    <MissionControlNowProvider>
      <div
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-1 pb-10 pt-2"
        data-tenant-id={tenantId}
        aria-busy={isPending || Boolean(pendingId)}
      >
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </div>

        {/* 1. Header */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="text-start">
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {t(`greeting.${greetingKey()}`, { name: greetingName })}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {clinicName} · {dateLabel}
            </p>
            <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreateWalkIn ? (
              <button
                type="button"
                onClick={() => setShowTools((value) => !value)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-subtle bg-surface px-4 text-sm font-medium text-primary transition hover:border-accent/40"
              >
                <UserRoundPlus className="h-4 w-4" aria-hidden />
                {t("walkIn")}
              </button>
            ) : null}
            <Link
              href="/dashboard/upcoming"
              className="inline-flex min-h-11 items-center rounded-xl border border-subtle bg-surface px-4 text-sm font-medium text-primary transition hover:border-accent/40"
            >
              {t("schedule")}
            </Link>
          </div>
        </header>

        {showTools ? (
          <div className="max-w-md">
            <QuickOpsPanel
              clinicName={clinicName}
              dateLabel={dateLabel}
              services={services}
              canViewRevenue={false}
              canCreateWalkIn={canCreateWalkIn}
              canManageQueue={canManageQueue}
              pendingTomorrowCount={0}
              yesterdayUnpaid={[]}
              attentionItems={[]}
              unreadCount={0}
              onWalkInAdded={onWalkInAdded}
              compact
            />
          </div>
        ) : null}

        {/* 2–3. Current + Next */}
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <PatientHero
            title={t("currentTitle")}
            appointment={currentPatient}
            locale={locale}
            mode="current"
            canManageQueue={canManageQueue}
            busy={Boolean(pendingId)}
            onPrimary={() => {
              if (currentPatient) persistStatus(currentPatient, "completed");
            }}
          />
          <PatientHero
            title={t("nextTitle")}
            appointment={nextPatient}
            locale={locale}
            mode="next"
            canManageQueue={canManageQueue}
            busy={Boolean(pendingId)}
            onPrimary={() => {
              if (!nextPatient) return;
              persistStatus(
                nextPatient,
                nextPatient.status === "checked_in"
                  ? "in_session"
                  : "checked_in",
              );
            }}
          />
        </div>

        {/* 4. Floor */}
        <section className="min-h-0">
          <LiveFloorBoard
            appointments={appointments}
            totalToday={metrics.totalToday}
            pendingId={pendingId}
            locale={locale}
            doctorGlow={doctorGlow}
            canManageQueue={canManageQueue}
            canViewRevenue={false}
            pendingTomorrowCount={pendingTomorrowCount}
            unpaidCount={unpaidCount}
            onDragEnd={onDragEnd}
            onStatusChange={persistStatus}
          />
        </section>

        {/* 5. Quiet status */}
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-subtle bg-surface px-4 py-3 text-sm text-muted">
          <p>
            {t("statusLine", {
              waiting: metrics.waitingNow,
              avgWait: metrics.averageWaitMinutes,
            })}
          </p>
          {attentionItems[0] ? (
            <p className="font-medium text-primary">
              {t("alertPrefix")} {attentionItems[0].title}
            </p>
          ) : (
            <p>{t("statusCalm")}</p>
          )}
        </footer>
      </div>
    </MissionControlNowProvider>
  );
}
