"use client";

import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import { useLocale } from "next-intl";
import { InteractiveAgendaCanvas } from "./InteractiveAgendaCanvas";
import { UpcomingAppointmentsShell } from "./UpcomingAppointmentsShell";
import type { AgendaAppointment } from "@/lib/queries/agenda";
import type { DashboardService } from "@/lib/dashboard/types";
import type { AgendaPatientOption } from "./AgendaAppointmentModal";
import type { WorkingHoursDay } from "@/lib/scheduling/types";

interface UpcomingViewSwitcherProps {
  appointments: AgendaAppointment[];
  services: DashboardService[];
  patients: AgendaPatientOption[];
  workingHours: WorkingHoursDay[];
}

export function UpcomingViewSwitcher({
  appointments,
  services,
  patients,
  workingHours,
}: UpcomingViewSwitcherProps) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const locale = useLocale();

  return (
    <div className="flex flex-col w-full h-full">
      <div className="mx-auto w-full max-w-7xl mb-2 flex justify-end px-4 sm:px-0">
        <div className="flex items-center gap-1 bg-surface border border-subtle rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setView("list")}
            className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition",
              view === "list" ? "bg-accent/15 text-accent" : "text-muted hover:text-primary hover:bg-elevated"
            ].join(" ")}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === "ar" ? "قائمة المواعيد" : "List"}</span>
          </button>
          <button
            onClick={() => setView("calendar")}
            className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition",
              view === "calendar" ? "bg-accent/15 text-accent" : "text-muted hover:text-primary hover:bg-elevated"
            ].join(" ")}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === "ar" ? "التقويم" : "Calendar"}</span>
          </button>
        </div>
      </div>

      {view === "list" ? (
        <UpcomingAppointmentsShell
          appointments={appointments}
          services={services}
          patients={patients}
        />
      ) : (
        <InteractiveAgendaCanvas
          appointments={appointments}
          services={services}
          patients={patients}
          workingHours={workingHours}
        />
      )}
    </div>
  );
}
