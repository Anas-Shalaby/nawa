"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CalendarClock, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { saveWorkingHours } from "@/actions/workingHours";
import type { WorkingHoursDay } from "@/lib/scheduling/types";

interface AvailabilitySettingsShellProps {
  initialDays: WorkingHoursDay[];
}

export function AvailabilitySettingsShell({ initialDays }: AvailabilitySettingsShellProps) {
  const t = useTranslations("availability");
  const [days, setDays] = useState(initialDays);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  function updateDay(dayOfWeek: number, patch: Partial<WorkingHoursDay>) {
    setDays((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await saveWorkingHours(days);

      if (!result.success) {
        setError(result.error ?? t("saveError"));
        return;
      }

      setMessage(t("saved"));
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-start">
        <Link href="/dashboard/settings" className="text-sm text-muted transition hover:text-primary">
          {t("backToSettings")}
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
            <CalendarClock className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-muted">Nawa</span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {days.map((day, index) => (
          <motion.div
            key={day.dayOfWeek}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.35 }}
            className="rounded-2xl border border-subtle/70 bg-surface/50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-start">
                <p className="font-medium text-primary">{dayLabels[day.dayOfWeek]}</p>
                <p className="text-xs text-muted">
                  {day.isOpen ? t("openLabel") : t("closedLabel")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{t("toggleOpen")}</span>
                <label className="relative inline-flex h-6 w-11 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, {
                        isOpen: event.target.checked,
                        startTime: event.target.checked ? day.startTime ?? "09:00" : null,
                        endTime: event.target.checked ? day.endTime ?? "17:00" : null,
                      })
                    }
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-subtle transition peer-checked:bg-accent" />
                  <span className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-primary transition peer-checked:ms-[1.25rem]" />
                </label>
              </div>
            </div>

            {day.isOpen ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block text-start">
                  <span className="mb-1.5 block text-xs text-muted">{t("from")}</span>
                  <input
                    type="time"
                    value={day.startTime ?? "09:00"}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, { startTime: event.target.value })
                    }
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block text-start">
                  <span className="mb-1.5 block text-xs text-muted">{t("to")}</span>
                  <input
                    type="time"
                    value={day.endTime ?? "17:00"}
                    onChange={(event) =>
                      updateDay(day.dayOfWeek, { endTime: event.target.value })
                    }
                    className="w-full rounded-xl border border-subtle bg-base px-3 py-2.5 text-sm text-primary focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>
            ) : null}
          </motion.div>
        ))}

        {error ? <p className="text-sm text-accent-danger">{error}</p> : null}
        {message ? <p className="text-sm text-accent-success">{message}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("saving")}
            </>
          ) : (
            t("save")
          )}
        </button>
      </form>
    </div>
  );
}
