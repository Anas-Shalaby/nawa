"use client";

import { useTranslations } from "next-intl";
import type { DoctorOperationalStatus } from "@/lib/dashboard/types";

interface DoctorStatusCardProps {
  doctors: DoctorOperationalStatus[];
}

export function DoctorStatusCard({ doctors }: DoctorStatusCardProps) {
  const t = useTranslations("dashboard.commandCenter.radar");

  return (
    <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
      <h2 className="mb-2 text-xs font-semibold text-primary">{t("doctorTitle")}</h2>
      <ul className="space-y-2">
        {doctors.map((doctor) => (
          <li
            key={doctor.id}
            className="rounded-lg border border-subtle bg-surface px-2.5 py-2 text-[11px]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-primary">{doctor.displayName}</p>
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                  doctor.availability === "available"
                    ? "bg-accent-success/15 text-accent-success"
                    : doctor.availability === "busy"
                      ? "bg-accent-danger/15 text-accent-danger"
                      : "bg-accent-warning/15 text-accent-warning",
                ].join(" ")}
              >
                {t(`availability.${doctor.availability}`)}
              </span>
            </div>
            <p className="mt-1 text-muted">
              {doctor.roomLabel
                ? t("doctorRoom", { room: doctor.roomLabel })
                : t("doctorNoRoom")}
            </p>
            {doctor.currentPatientName ? (
              <p className="text-primary">
                {t("doctorPatient", { name: doctor.currentPatientName })}
              </p>
            ) : (
              <p className="text-muted">{t("doctorIdle")}</p>
            )}
            <p className="mt-1 text-[10px] text-muted">
              {t("doctorQueue", {
                count: doctor.remainingQueue,
                avg: doctor.avgConsultMinutes,
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
