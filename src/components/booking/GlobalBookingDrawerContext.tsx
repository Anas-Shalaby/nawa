"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { DashboardService } from "@/lib/dashboard/types";
import { GlobalBookingDrawer } from "./GlobalBookingDrawer";

export interface BookingDrawerSelection {
  date?: string;
  time?: string;
  serviceId?: string;
}

interface GlobalBookingDrawerContextValue {
  openBookingDrawer: (selection?: BookingDrawerSelection) => void;
  closeBookingDrawer: () => void;
}

const GlobalBookingDrawerContext =
  createContext<GlobalBookingDrawerContextValue | null>(null);

export function GlobalBookingDrawerProvider({
  services,
  children,
}: {
  services: DashboardService[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [initialSelection, setInitialSelection] =
    useState<BookingDrawerSelection>();
  const value = useMemo(
    () => ({
      openBookingDrawer: (selection?: BookingDrawerSelection) => {
        setInitialSelection(selection);
        setOpen(true);
      },
      closeBookingDrawer: () => setOpen(false),
    }),
    [],
  );

  return (
    <GlobalBookingDrawerContext.Provider value={value}>
      {children}
      <GlobalBookingDrawer
        open={open}
        services={services}
        initialSelection={initialSelection}
        onClose={() => setOpen(false)}
      />
    </GlobalBookingDrawerContext.Provider>
  );
}

export function useGlobalBookingDrawer(): GlobalBookingDrawerContextValue {
  const context = useContext(GlobalBookingDrawerContext);
  if (!context) {
    throw new Error(
      "useGlobalBookingDrawer must be used within GlobalBookingDrawerProvider.",
    );
  }
  return context;
}
