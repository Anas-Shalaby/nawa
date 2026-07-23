import { ALL_PHASES } from "./phases";
import type { EvaluatedPhase, EvaluatedStep, JourneyEngineContext, JourneyStep } from "./types";

function checkStepCompletion(stepId: string, context: JourneyEngineContext): boolean {
  switch (stepId) {
    case "clinic_logo":
      return context.hasLogo;
    case "specialty":
      return context.hasSpecialty;
    case "working_hours":
      return context.hasWorkingHours;
    case "services":
      return context.hasServices;
    case "invite_team":
      return context.hasTeamMembers;
    case "first_patient":
      return context.hasPatients;
    case "first_appointment":
      return context.hasAppointments;
    case "first_session":
      return context.hasCompletedSessions;
    case "customize_roles":
    case "financial_settings":
      return false; // These are optional in phase 3, might be manual or need advanced logic later
    default:
      return false;
  }
}

export function evaluateJourney(context: JourneyEngineContext): EvaluatedPhase[] {
  const evaluatedPhases: EvaluatedPhase[] = [];

  let globalStepsCompleted: Record<string, boolean> = {};

  for (const phase of ALL_PHASES) {
    const evaluatedSteps: EvaluatedStep[] = phase.steps.map((step) => {
      const isCompleted = checkStepCompletion(step.id, context);
      if (isCompleted) {
        globalStepsCompleted[step.id] = true;
      }
      return {
        ...step,
        isCompleted,
        isLocked: false,
      };
    });

    // Evaluate locks (if a dependency is not completed, lock it)
    for (const step of evaluatedSteps) {
      if (step.dependsOn && step.dependsOn.length > 0) {
        const hasUnmetDeps = step.dependsOn.some((depId) => !globalStepsCompleted[depId]);
        if (hasUnmetDeps) {
          step.isLocked = true;
        }
      }
    }

    const totalSteps = evaluatedSteps.length;
    const completedSteps = evaluatedSteps.filter((s) => s.isCompleted).length;
    const progressPercentage = totalSteps === 0 ? 100 : Math.round((completedSteps / totalSteps) * 100);

    evaluatedPhases.push({
      ...phase,
      evaluatedSteps,
      isCompleted: completedSteps === totalSteps,
      progressPercentage,
    });
  }

  return evaluatedPhases;
}
