"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, Copy, Loader2, Plus, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Can } from "@/components/auth/Can";
import { saveWorkingHours } from "@/actions/workingHours";
import {
  buildTimeOptions,
  createShift,
  derivePrimaryWindow,
  formatTimeLabel,
  type WorkingHoursDay,
  type WorkingHoursShift,
} from "@/lib/scheduling/types";

interface ScheduleSettingsShellProps {
  initialDays: WorkingHoursDay[];
}

function DayToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-subtle",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all",
          checked ? "inset-e-0.5" : "inset-s-0.5",
        ].join(" ")}
        style={
          checked
            ? { insetInlineEnd: "2px", insetInlineStart: "auto" }
            : { insetInlineStart: "2px", insetInlineEnd: "auto" }
        }
      />
    </button>
  );
}

function TimeSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const locale = useLocale();
  const options = useMemo(() => buildTimeOptions(), []);

  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-subtle bg-base/50 px-2 py-1.5 text-xs font-medium text-primary outline-none transition focus:border-accent"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatTimeLabel(option, locale === "ar" ? "ar" : "en")}
        </option>
      ))}
    </select>
  );
}

export function ScheduleSettingsShell({ initialDays }: ScheduleSettingsShellProps) {
  const t = useTranslations("availability");
  const [days, setDays] = useState(initialDays);
  const [isPending, startTransition] = useTransition();

  const dayLabels = useMemo(
    () =>
      ({
        6: t("days.saturday"),
        0: t("days.sunday"),
        1: t("days.monday"),
        2: t("days.tuesday"),
        3: t("days.wednesday"),
        4: t("days.thursday"),
        5: t("days.friday"),
      }) as Record<number, string>,
    [t],
  );

  function setDayOpen(dayOfWeek: number, isOpen: boolean) {
    setDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        if (!isOpen) {
          return {
            ...day,
            isOpen: false,
            startTime: null,
            endTime: null,
            shifts: [],
          };
        }
        const shifts =
          day.shifts.length > 0 ? day.shifts : [createShift("09:00", "17:00")];
        const primary = derivePrimaryWindow(shifts);
        return {
          ...day,
          isOpen: true,
          shifts,
          startTime: primary.startTime,
          endTime: primary.endTime,
        };
      }),
    );
  }

  function updateShift(
    dayOfWeek: number,
    shiftId: string,
    patch: Partial<WorkingHoursShift>,
  ) {
    setDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const shifts = day.shifts.map((shift) =>
          shift.id === shiftId ? { ...shift, ...patch } : shift,
        );
        const primary = derivePrimaryWindow(shifts);
        return {
          ...day,
          shifts,
          startTime: primary.startTime,
          endTime: primary.endTime,
        };
      }),
    );
  }

  function addShift(dayOfWeek: number) {
    setDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek || !day.isOpen) return day;
        if (day.shifts.length >= 3) return day;
        const shifts = [...day.shifts, createShift("18:00", "22:00")];
        const primary = derivePrimaryWindow(shifts);
        return {
          ...day,
          shifts,
          startTime: primary.startTime,
          endTime: primary.endTime,
        };
      }),
    );
  }

  function removeShift(dayOfWeek: number, shiftId: string) {
    setDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const shifts = day.shifts.filter((shift) => shift.id !== shiftId);
        if (shifts.length === 0) {
          return {
            ...day,
            isOpen: false,
            shifts: [],
            startTime: null,
            endTime: null,
          };
        }
        const primary = derivePrimaryWindow(shifts);
        return {
          ...day,
          shifts,
          startTime: primary.startTime,
          endTime: primary.endTime,
        };
      }),
    );
  }

  function copySaturdayToAll() {
    const saturday = days.find((day) => day.dayOfWeek === 6);
    if (!saturday) return;

    setDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek === 6) return day;
        const shifts = saturday.isOpen
          ? saturday.shifts.map((shift) =>
              createShift(shift.startTime, shift.endTime),
            )
          : [];
        const primary = derivePrimaryWindow(shifts);
        return {
          ...day,
          isOpen: saturday.isOpen,
          shifts,
          startTime: saturday.isOpen ? primary.startTime : null,
          endTime: saturday.isOpen ? primary.endTime : null,
        };
      }),
    );
    toast.success(t("copiedSaturday"));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveWorkingHours(days);
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      toast.success(t("saved"));
    });
  }

  return (
    <div className="mx-auto max-w-4xl pb-28" dir="rtl">
      <div className="mb-8 text-start">
        <Link
          href="/dashboard/settings/clinic"
          className="text-sm text-muted transition hover:text-primary"
        >
          {t("backToClinic")}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                <CalendarClock className="h-4 w-4 text-accent" aria-hidden />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-primary">{t("canvasTitle")}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">{t("canvasSubtitle")}</p>
          </div>

          <button
            type="button"
            onClick={copySaturdayToAll}
            className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-primary transition hover:border-accent/40 hover:bg-accent/10"
          >
            <Copy className="h-4 w-4 text-accent" aria-hidden />
            {t("copySaturday")}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day, index) => (
          <motion.div
            key={day.dayOfWeek}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={[
              "mb-0 flex flex-col gap-4 rounded-2xl border border-subtle bg-surface p-4 transition-all sm:flex-row sm:items-center sm:justify-between",
              day.isOpen ? "" : "opacity-70",
            ].join(" ")}
          >
            <div
              className={[
                "flex min-w-[160px] items-center gap-3 text-start",
                day.isOpen ? "" : "text-muted",
              ].join(" ")}
            >
              <DayToggle
                checked={day.isOpen}
                onChange={(next) => setDayOpen(day.dayOfWeek, next)}
                label={dayLabels[day.dayOfWeek]}
              />
              <div>
                <p
                  className={[
                    "text-lg font-bold",
                    day.isOpen ? "text-primary" : "text-muted",
                  ].join(" ")}
                >
                  {dayLabels[day.dayOfWeek]}
                </p>
                <p className="text-xs text-muted">
                  {day.isOpen ? t("openLabel") : t("dayOff")}
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait" initial={false}>
                {day.isOpen ? (
                  <motion.div
                    key="open"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {day.shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center gap-2 rounded-xl border border-subtle bg-elevated px-3 py-2"
                      >
                        <TimeSelect
                          value={shift.startTime}
                          ariaLabel={t("from")}
                          onChange={(value) =>
                            updateShift(day.dayOfWeek, shift.id, { startTime: value })
                          }
                        />
                        <span className="text-xs text-muted">➔</span>
                        <TimeSelect
                          value={shift.endTime}
                          ariaLabel={t("to")}
                          onChange={(value) =>
                            updateShift(day.dayOfWeek, shift.id, { endTime: value })
                          }
                        />
                        {day.shifts.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeShift(day.dayOfWeek, shift.id)}
                            className="rounded-md p-1 text-muted transition hover:bg-accent-danger/15 hover:text-accent-danger"
                            aria-label={t("removeShift")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ))}

                    {day.shifts.length < 3 ? (
                      <button
                        type="button"
                        onClick={() => addShift(day.dayOfWeek)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        {t("addShift")}
                      </button>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start sm:justify-end"
                  >
                    <span className="rounded-full border border-subtle bg-base/40 px-3 py-1.5 text-xs font-medium text-muted">
                      {t("closedBadge")}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <Can permission="clinic.manage">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-subtle bg-base/90 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("saving")}
                </>
              ) : (
                t("saveSettings")
              )}
            </button>
          </div>
        </div>
      </Can>
    </div>
  );
}
