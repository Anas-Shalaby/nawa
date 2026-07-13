"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import {
  Banknote,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  Megaphone,
  Package,
  Settings,
  Stethoscope,
  UserCog,
  Users,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

interface NavSection {
  sectionKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: "sectionOperations",
    items: [
      { href: "/dashboard", labelKey: "navQueue", icon: KanbanSquare },
      {
        href: "/dashboard/upcoming",
        labelKey: "navUpcoming",
        icon: CalendarDays,
      },
      {
        href: "/dashboard/notifications",
        labelKey: "navNotifications",
        icon: Bell,
      },
    ],
  },
  {
    sectionKey: "sectionClinic",
    items: [
      { href: "/dashboard/patients", labelKey: "navPatients", icon: Users },
      {
        href: "/dashboard/services",
        labelKey: "navServices",
        icon: Stethoscope,
      },
      { href: "/dashboard/inventory", labelKey: "navInventory", icon: Package },
      { href: "/dashboard/staff", labelKey: "navStaff", icon: UserCog },
    ],
  },
  {
    sectionKey: "sectionFinance",
    items: [
      {
        href: "/dashboard/analytics",
        labelKey: "navAnalytics",
        icon: BarChart3,
      },
      {
        href: "/dashboard/financials",
        labelKey: "navFinancials",
        icon: Banknote,
      },
      {
        href: "/dashboard/marketing",
        labelKey: "navMarketing",
        icon: Megaphone,
      },
      {
        href: "/dashboard/ai-assistant",
        labelKey: "navAiAssistant",
        icon: Bot,
      },
    ],
  },
  {
    sectionKey: "sectionSystem",
    items: [
      { href: "/dashboard/settings", labelKey: "navSettings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const t = useTranslations("dashboard.layout");
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
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
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={onCloseMobile}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15">
            <Image
              src="/icons/icon-192.png"
              alt="logo"
              width={36}
              height={36}
            />
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

      <nav className="flex-1 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.sectionKey}
            className={
              sectionIndex > 0 ? "mt-5 border-t border-subtle/60 pt-4" : ""
            }
          >
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted/80">
                {t(section.sectionKey)}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? t(item.labelKey) : undefined}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-accent/15 text-accent"
                          : "text-muted hover:bg-elevated hover:text-primary",
                        collapsed ? "justify-center px-2" : "",
                      ].join(" ")}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      {!collapsed && <span>{t(item.labelKey)}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
  );
}
