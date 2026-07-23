import type { JourneyPhase } from "./types";

export const PHASE_1: JourneyPhase = {
  id: "phase_1",
  titleKey: "phase1.title",
  steps: [
    {
      id: "clinic_logo",
      titleKey: "phase1.steps.logo.title",
      descKey: "phase1.steps.logo.desc",
      priority: 10,
      estimatedMinutes: 1,
      actionPath: "/dashboard/settings/clinic",
    },
    {
      id: "specialty",
      titleKey: "phase1.steps.specialty.title",
      descKey: "phase1.steps.specialty.desc",
      priority: 20,
      estimatedMinutes: 1,
      actionPath: "/dashboard/settings/clinic",
    },
    {
      id: "working_hours",
      titleKey: "phase1.steps.hours.title",
      descKey: "phase1.steps.hours.desc",
      priority: 30,
      estimatedMinutes: 2,
      actionPath: "/dashboard/settings/schedule",
    },
    {
      id: "services",
      titleKey: "phase1.steps.services.title",
      descKey: "phase1.steps.services.desc",
      priority: 40,
      estimatedMinutes: 3,
      actionPath: "/dashboard/settings/services",
    },
    {
      id: "invite_team",
      titleKey: "phase1.steps.team.title",
      descKey: "phase1.steps.team.desc",
      priority: 50,
      estimatedMinutes: 2,
      actionPath: "/dashboard/staff",
    },
  ],
};

export const PHASE_2: JourneyPhase = {
  id: "phase_2",
  titleKey: "phase2.title",
  steps: [
    {
      id: "first_patient",
      titleKey: "phase2.steps.patient.title",
      descKey: "phase2.steps.patient.desc",
      priority: 10,
      estimatedMinutes: 1,
      actionPath: "/dashboard/patients",
    },
    {
      id: "first_appointment",
      titleKey: "phase2.steps.appointment.title",
      descKey: "phase2.steps.appointment.desc",
      priority: 20,
      estimatedMinutes: 1,
      dependsOn: ["first_patient"],
      actionPath: "/dashboard", // Booking drawer can be opened
    },
    {
      id: "first_session",
      titleKey: "phase2.steps.session.title",
      descKey: "phase2.steps.session.desc",
      priority: 30,
      estimatedMinutes: 15,
      dependsOn: ["first_appointment"],
      actionPath: "/dashboard",
    },
  ],
};

export const PHASE_3: JourneyPhase = {
  id: "phase_3",
  titleKey: "phase3.title",
  steps: [
    {
      id: "customize_roles",
      titleKey: "phase3.steps.roles.title",
      descKey: "phase3.steps.roles.desc",
      priority: 10,
      estimatedMinutes: 2,
      actionPath: "/dashboard/staff",
    },
    {
      id: "financial_settings",
      titleKey: "phase3.steps.finance.title",
      descKey: "phase3.steps.finance.desc",
      priority: 20,
      estimatedMinutes: 2,
      actionPath: "/dashboard/settings",
    },
  ],
};

export const ALL_PHASES = [PHASE_1, PHASE_2, PHASE_3];
