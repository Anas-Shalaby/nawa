"use client";

import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  CalendarClock,
  ChevronDown,
  MessageCircle,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { TeamLiveStatus, TeamMemberView } from "@/lib/team/types";
import { DaySchedulePreview } from "./DaySchedulePreview";
import { LiveStatusBadge } from "./LiveStatusBadge";
import { StatusPicker } from "./StatusPicker";
import { WorkloadMeter } from "./WorkloadMeter";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function toWhatsAppHref(phone: string): string | null {
  const digits = digitsOnly(phone);
  if (digits.length < 10) return null;
  const normalized = digits.startsWith("20")
    ? digits
    : digits.startsWith("0")
      ? `20${digits.slice(1)}`
      : digits;
  return `https://wa.me/${normalized}`;
}

interface TeamMemberCardProps {
  member: TeamMemberView;
  canManage: boolean;
  onStatusChanged: (memberId: string, status: TeamLiveStatus) => void;
  onAssignPatient: (memberId: string) => void;
  onTransferPatient: (memberId: string) => void;
  onOpenProfile: (memberId: string) => void;
}

export const TeamMemberCard = memo(function TeamMemberCard({
  member,
  canManage,
  onStatusChanged,
  onAssignPatient,
  onTransferPatient,
  onOpenProfile,
}: TeamMemberCardProps) {
  const t = useTranslations("teamOps");
  const [expanded, setExpanded] = useState(false);

  const telHref = member.phone ? `tel:${member.phone}` : null;
  const waHref = member.phone ? toWhatsAppHref(member.phone) : null;
  const canMutate = canManage && member.id !== "primary-doctor";

  return (
    <article
      className={[
        "group flex flex-col rounded-2xl border border-subtle bg-surface/80 p-4 transition",
        "hover:border-accent/30 hover:bg-elevated/50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-sm font-semibold text-accent"
          aria-hidden
        >
          {initials(member.displayName)}
        </div>
        <div className="min-w-0 flex-1 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-primary">{member.displayName}</h3>
            <LiveStatusBadge status={member.status} compact />
            {member.isSuspended ? (
              <span className="rounded-full bg-accent-danger/10 px-2 py-0.5 text-[10px] font-semibold text-accent-danger">
                {t("card.suspended")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {t(`roles.${member.role}`)}
            {member.department ? ` · ${member.department}` : ""}
          </p>
          {member.workingHoursLabel ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted">
              <CalendarClock className="h-3 w-3" aria-hidden />
              {member.workingHoursLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-elevated/60 px-2 py-2">
          <p className="text-sm font-semibold tabular-nums text-primary">{member.todayAppointments}</p>
          <p className="text-[10px] text-muted">{t("card.appointments")}</p>
        </div>
        <div className="rounded-xl bg-elevated/60 px-2 py-2">
          <p className="text-sm font-semibold tabular-nums text-primary">{member.waitingPatients}</p>
          <p className="text-[10px] text-muted">{t("card.waiting")}</p>
        </div>
        <div className="rounded-xl bg-elevated/60 px-2 py-2">
          <p className="text-sm font-semibold tabular-nums text-primary">{member.avgConsultMinutes}</p>
          <p className="text-[10px] text-muted">{t("card.avgMins")}</p>
        </div>
      </div>

      <div className="mt-3">
        <WorkloadMeter
          pct={member.workload.pct}
          heat={member.workload.heat}
          bookedMinutes={member.workload.bookedMinutes}
          capacityMinutes={member.workload.capacityMinutes}
        />
      </div>

      {member.currentPatientName ? (
        <p className="mt-3 rounded-xl border border-status-checkedIn/20 bg-status-checkedIn/5 px-3 py-2 text-start text-xs text-primary">
          {t("card.currentPatient", { name: member.currentPatientName })}
        </p>
      ) : (
        <p className="mt-3 text-start text-xs text-muted">{t("card.noPatient")}</p>
      )}

      {member.ratingAvg != null ? (
        <p className="mt-2 text-start text-[11px] text-muted">
          {t("card.rating", { rating: member.ratingAvg.toFixed(1) })}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onOpenProfile(member.id)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary"
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          {t("actions.profile")}
        </button>
        {telHref ? (
          <a
            href={telHref}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {t("actions.call")}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => toast.message(t("actions.noPhone"))}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted/60"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {t("actions.call")}
          </button>
        )}

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {t("actions.message")}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => toast.message(t("actions.noPhone"))}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted/60"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            {t("actions.message")}
          </button>
        )}

        {canMutate ? (
          <>
            <StatusPicker
              staffId={member.id}
              current={member.status}
              onChanged={(status) => onStatusChanged(member.id, status)}
            />
            <button
              type="button"
              onClick={() => onAssignPatient(member.id)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary"
            >
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              {t("actions.assign")}
            </button>
            {member.waitingPatients > 0 ? (
              <button
                type="button"
                onClick={() => onTransferPatient(member.id)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
                {t("actions.transfer")}
              </button>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="ms-auto inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-accent transition hover:bg-accent/10"
        >
          {t("actions.schedule")}
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-subtle pt-4">
              <p className="mb-3 text-xs font-semibold text-primary">{t("schedule.title")}</p>
              <DaySchedulePreview slots={member.scheduleToday} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
});
