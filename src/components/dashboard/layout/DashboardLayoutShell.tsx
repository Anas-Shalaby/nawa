"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheaterMode } from "@/components/ehr/TheaterModeContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";

interface DashboardLayoutShellProps {
  clinicName: string;
  children: React.ReactNode;
}

export function DashboardLayoutShell({ clinicName, children }: DashboardLayoutShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isTheater } = useTheaterMode();

  return (
    <div className="min-h-screen bg-base">
      <AnimatePresence>
        {!isTheater && mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {!isTheater && (
        <DashboardSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />
      )}

      <div
        className={[
          "flex min-h-screen flex-col transition-[margin] duration-300 ease-out",
          isTheater ? "" : collapsed ? "lg:ms-20" : "lg:ms-64",
        ].join(" ")}
      >
        {!isTheater && (
          <DashboardTopbar
            clinicName={clinicName}
            onOpenMobileMenu={() => setMobileOpen(true)}
          />
        )}
        <main className={isTheater ? "" : "flex-1 px-4 py-6 sm:px-6"}>{children}</main>
      </div>
    </div>
  );
}
