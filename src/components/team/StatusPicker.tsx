"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { setTeamMemberAvailability } from "@/actions/manageTeam";
import type { TeamLiveStatus } from "@/lib/team/types";

const OPTIONS: Array<"available" | "busy" | "break" | "offline"> = [
  "available",
  "busy",
  "break",
  "offline",
];

function toLiveStatus(
  value: "available" | "busy" | "break" | "offline",
): TeamLiveStatus {
  return value;
}

interface StatusPickerProps {
  staffId: string;
  current: TeamLiveStatus;
  disabled?: boolean;
  onChanged: (status: TeamLiveStatus) => void;
}

export function StatusPicker({ staffId, current, disabled, onChanged }: StatusPickerProps) {
  const t = useTranslations("teamOps");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(value: "available" | "busy" | "break" | "offline") {
    if (disabled || pending) return;
    setOpen(false);
    startTransition(async () => {
      const result = await setTeamMemberAvailability(staffId, value);
      if (!result.success) {
        toast.error(result.error ?? t("errors.statusUpdate"));
        return;
      }
      onChanged(toLiveStatus(value));
      toast.success(t("toasts.statusUpdated"));
    });
  }

  const selected =
    current === "in_session"
      ? "busy"
      : current === "on_leave"
        ? "offline"
        : current === "break" || current === "offline" || current === "busy"
          ? current
          : "available";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || pending}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-subtle px-2 text-[11px] font-medium text-muted transition hover:border-accent/30 hover:text-primary disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
        {t("actions.setStatus")}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-subtle bg-surface py-1 shadow-lg"
          >
            {OPTIONS.map((option) => (
              <li key={option} role="option" aria-selected={selected === option}>
                <button
                  type="button"
                  onClick={() => select(option)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-xs text-primary transition hover:bg-elevated"
                >
                  {t(`status.${option}`)}
                  {selected === option ? (
                    <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
                  ) : null}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
