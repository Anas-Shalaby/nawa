"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { switchClinic } from "@/actions/switchClinic";
import type { ClinicMembershipOption } from "@/lib/auth/membership";
import type { TeamRole } from "@/lib/team/types";

interface ClinicSwitcherProps {
  activeTenantId: string;
  clinics: ClinicMembershipOption[];
  /** Fallback label when clinics list is empty */
  clinicName: string;
}

const ROLE_MESSAGE_KEYS: Record<TeamRole, string> = {
  owner: "roles.owner",
  admin: "roles.admin",
  doctor: "roles.doctor",
  receptionist: "roles.receptionist",
  nurse: "roles.nurse",
  assistant: "roles.assistant",
  lab: "roles.lab",
  manager: "roles.manager",
  cashier: "roles.cashier",
  intern: "roles.intern",
};

export function ClinicSwitcher({
  activeTenantId,
  clinics,
  clinicName,
}: ClinicSwitcherProps) {
  const t = useTranslations("dashboard.clinicSwitcher");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function roleLabel(role: TeamRole) {
    return t(ROLE_MESSAGE_KEYS[role]);
  }

  const active =
    clinics.find((c) => c.tenantId === activeTenantId) ??
    (clinics[0]
      ? clinics[0]
      : {
          membershipId: "fallback",
          tenantId: activeTenantId,
          clinicName,
          slug: "",
          role: "doctor" as const,
        });

  const canSwitch = clinics.length > 1;

  function onSelect(tenantId: string) {
    if (tenantId === activeTenantId || pending) {
      setOpen(false);
      return;
    }

    startTransition(async () => {
      setOpen(false);
      const result = await switchClinic(tenantId);
      if (result && !result.success) {
        toast.error(result.error ?? t("error"));
      }
    });
  }

  if (!canSwitch) {
    return (
      <div className="text-start">
        <p className="text-sm font-semibold text-primary">{active.clinicName}</p>
      </div>
    );
  }

  return (
    <div className="relative text-start">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-xl border border-subtle bg-surface px-2.5 py-1.5 text-start transition hover:border-accent/30 sm:max-w-xs"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
          {active.clinicName}
        </span>
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted" aria-hidden />
        ) : (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={t("label")}
            className="absolute start-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-subtle bg-surface shadow-lg"
          >
            <div className="border-b border-subtle px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t("switchTo")}
              </p>
            </div>
            <ul className="max-h-64 overflow-y-auto p-1.5">
              {clinics.map((clinic) => {
                const selected = clinic.tenantId === activeTenantId;
                return (
                  <li key={clinic.tenantId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={pending}
                      onClick={() => onSelect(clinic.tenantId)}
                      className={[
                        "flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-start transition",
                        selected ? "bg-accent/10" : "hover:bg-elevated",
                      ].join(" ")}
                    >
                      <Building2
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-primary">
                          {clinic.clinicName}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {roleLabel(clinic.role)}
                        </span>
                      </span>
                      {selected ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
