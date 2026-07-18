"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreVertical,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { PatientRecord } from "@/lib/queries/patients";
import { Can } from "@/components/auth/Can";
import { usePermission } from "@/components/auth/PermissionProvider";

interface PatientActionsMenuProps {
  patient: PatientRecord;
  pending: boolean;
  onEdit: () => void;
  onClearWarning: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}

interface MenuPosition {
  top: number;
  left: number;
  openUpward: boolean;
}

const MENU_WIDTH = 220;
const MENU_ESTIMATED_HEIGHT = 220;
const VIEWPORT_GAP = 8;

export function PatientActionsMenu({
  patient,
  pending,
  onEdit,
  onClearWarning,
  onArchiveToggle,
  onDelete,
}: PatientActionsMenuProps) {
  const t = useTranslations("patients");
  const canUpdate = usePermission("patients.update");
  const canArchive = usePermission("patients.archive");
  const canDelete = usePermission("patients.delete");
  const hasAnyAction = canUpdate || canArchive || canDelete;
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward =
        spaceBelow < MENU_ESTIMATED_HEIGHT && rect.top > spaceBelow;

      let left = rect.right - MENU_WIDTH;
      left = Math.max(
        VIEWPORT_GAP,
        Math.min(left, window.innerWidth - MENU_WIDTH - VIEWPORT_GAP),
      );

      const top = openUpward
        ? Math.max(VIEWPORT_GAP, rect.top - VIEWPORT_GAP)
        : Math.min(
            rect.bottom + VIEWPORT_GAP,
            window.innerHeight - VIEWPORT_GAP,
          );

      setPosition({ top, left, openUpward });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function runAndClose(action: () => void) {
    setOpen(false);
    action();
  }

  const menu =
    open && mounted && position
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: position.openUpward ? undefined : position.top,
              bottom: position.openUpward
                ? window.innerHeight - position.top
                : undefined,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="z-[80] overflow-hidden rounded-xl border border-subtle bg-surface shadow-2xl"
          >
            {!patient.isArchived && (
              <Can permission="patients.update">
                <MenuItem
                  icon={<Pencil className="h-4 w-4" />}
                  label={t("edit")}
                  onClick={() => runAndClose(onEdit)}
                />
              </Can>
            )}
            {!patient.isArchived && patient.noShowCount > 0 && (
              <Can permission="patients.update">
                <MenuItem
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label={t("clearWarning")}
                  onClick={() => runAndClose(onClearWarning)}
                />
              </Can>
            )}
            <Can permission="patients.archive">
              <MenuItem
                icon={
                  patient.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )
                }
                label={patient.isArchived ? t("restore") : t("archive")}
                onClick={() => runAndClose(onArchiveToggle)}
              />
            </Can>
            <Can permission="patients.delete">
              <MenuItem
                icon={<Trash2 className="h-4 w-4" />}
                label={t("delete")}
                danger
                onClick={() => runAndClose(onDelete)}
              />
            </Can>
          </div>,
          document.body,
        )
      : null;

  if (!hasAnyAction) return null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={pending}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary disabled:opacity-50"
        aria-label={t("actionsMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>
      {menu}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2.5 border-b border-subtle px-3.5 py-2.5 text-start text-sm last:border-b-0 transition",
        danger
          ? "text-accent-danger hover:bg-accent-danger/10"
          : "text-primary hover:bg-elevated",
      ].join(" ")}
    >
      <span className="shrink-0 opacity-80">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
