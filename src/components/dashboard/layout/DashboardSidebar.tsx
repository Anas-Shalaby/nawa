"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  Banknote,
  CalendarClock,
  CalendarDays,
  Settings,
  Stethoscope,
  Users,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "navQueue", icon: KanbanSquare },
  { href: "/dashboard/agenda", labelKey: "navAgenda", icon: CalendarDays },
  { href: "/dashboard/patients", labelKey: "navPatients", icon: Users },
  { href: "/dashboard/recalls", labelKey: "navRecalls", icon: CalendarClock },
  { href: "/dashboard/financials", labelKey: "navFinancials", icon: Banknote },
  { href: "/dashboard/services", labelKey: "navServices", icon: Stethoscope },
  { href: "/dashboard/settings", labelKey: "navSettings", icon: Settings },
] as const;

interface DashboardSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const t = useTranslations("dashboard.layout");
  const pathname = usePathname();

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : undefined }}
        className={[
          "fixed inset-y-0 start-0 z-50 flex flex-col border-e border-subtle bg-surface",
          "transition-[width] duration-300 ease-out",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "flex" : "hidden lg:flex",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-subtle px-4">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onCloseMobile}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <span className="text-sm font-bold text-accent">N</span>
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-start"
              >
                <p className="text-sm font-semibold text-primary">Nawa</p>
                <p className="text-xs text-muted">{t("brandTagline")}</p>
              </motion.div>
            )}
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary lg:hidden"
            aria-label={t("closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? t(item.labelKey) : undefined}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-elevated hover:text-primary",
                  collapsed ? "justify-center px-2" : "",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-subtle p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-subtle px-3 py-2 text-xs text-muted transition hover:bg-elevated hover:text-primary"
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            ) : (
              <>
                <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                {t("collapse")}
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
