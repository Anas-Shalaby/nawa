export type JourneyPhaseId = "phase_1" | "phase_2" | "phase_3";

export interface JourneyStep {
  id: string;
  titleKey: string; // i18n key for title
  descKey: string; // i18n key for description
  priority: number;
  estimatedMinutes: number;
  dependsOn?: string[]; // IDs of steps that must be completed first
  actionPath: string; // URL path to navigate to when clicked
  rewardKey?: string; // Optional reward message key
}

export interface JourneyPhase {
  id: JourneyPhaseId;
  titleKey: string;
  steps: JourneyStep[];
}

export interface JourneyState {
  phase: number;
  dismissed: boolean;
  last_seen_at: string | null;
}

export interface JourneyEngineContext {
  hasLogo: boolean;
  hasSpecialty: boolean;
  hasWorkingHours: boolean;
  hasServices: boolean;
  hasTeamMembers: boolean;
  hasPatients: boolean;
  hasAppointments: boolean;
  hasCompletedSessions: boolean;
}

export interface EvaluatedStep extends JourneyStep {
  isCompleted: boolean;
  isLocked: boolean;
}

export interface EvaluatedPhase extends JourneyPhase {
  evaluatedSteps: EvaluatedStep[];
  isCompleted: boolean;
  progressPercentage: number; // For internal use only (not UI)
}
