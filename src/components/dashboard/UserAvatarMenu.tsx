"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { logoutClinic } from "@/actions/logoutClinic";

export function UserAvatarMenu() {
  const t = useTranslations("dashboard.avatarMenu");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu = open && mounted
    ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed end-4 top-[4.25rem] z-[220] w-56 overflow-hidden rounded-2xl border border-subtle bg-surface shadow-lg"
        >
          <div className="border-b border-subtle px-3 py-2.5 text-start">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {t("personalOnly")}
            </p>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-primary transition hover:bg-elevated"
            >
              <UserRound className="h-4 w-4 text-accent" aria-hidden />
              {t("myAccount")}
            </Link>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-primary transition hover:bg-elevated"
            >
              <Settings className="h-4 w-4 text-accent" aria-hidden />
              {t("clinicSettings")}
            </Link>
          </div>
          <div className="border-t border-subtle p-1.5">
            <form action={logoutClinic}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-accent-danger transition hover:bg-accent-danger/10"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("logout")}
              </button>
            </form>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("open")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-subtle bg-surface px-2 py-1.5 text-muted transition hover:border-accent/30 hover:text-primary"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <UserRound className="h-4 w-4" aria-hidden />
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {menu}
    </>
  );
}
