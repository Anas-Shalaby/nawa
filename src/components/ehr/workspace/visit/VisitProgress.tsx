"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

interface StepItem {
  id: number;
  key: string;
  elementId: string;
  isCompleted: boolean;
  label?: string;
  description?: string;
}

interface VisitProgressProps {
  activeStep: number;
  steps: StepItem[];
  onStepClick: (elementId: string) => void;
}

export function VisitProgress({ activeStep, steps, onStepClick }: VisitProgressProps) {
  const t = useTranslations("ehr.workspace.visit");

  return (
    <nav className="sticky top-24 z-10 w-full hidden md:block" aria-label="Visit Progress">
      <div className="rounded-2xl bg-surface/50 p-5 border border-subtle/50 backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-4">
          {t("step10")} {/* Finish Visit or status title */}
        </h3>
        <ol className="relative border-s border-subtle/80 space-y-4 ms-2">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            const isCompleted = step.isCompleted;

            return (
              <li key={step.id} className="relative ps-6 group">
                {/* Dot / Check Icon */}
                <span
                  onClick={() => onStepClick(step.elementId)}
                  className={[
                    "absolute -start-3 top-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border text-[10px] font-semibold transition-all duration-200",
                    isActive
                      ? "border-accent bg-accent text-white shadow-sm shadow-accent/20 scale-110"
                      : isCompleted
                        ? "border-accent-success bg-accent-success/15 text-accent-success"
                        : "border-subtle bg-base text-muted hover:border-accent/40 hover:text-primary",
                  ].join(" ")}
                >
                  {isCompleted && !isActive ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </span>

                {/* Text description */}
                <div className="text-start">
                  <button
                    type="button"
                    onClick={() => onStepClick(step.elementId)}
                    className={[
                      "text-xs font-semibold transition-all text-start duration-200 focus:outline-none",
                      isActive
                        ? "text-accent"
                        : isCompleted
                          ? "text-primary/90 hover:text-accent"
                          : "text-muted hover:text-primary",
                    ].join(" ")}
                  >
                    {step.label || t(`step${step.id}`)}
                  </button>
                  <p
                    className={[
                      "text-[10px] leading-tight transition-all duration-200 mt-0.5",
                      isActive ? "text-muted" : "text-muted/50 group-hover:text-muted/70",
                    ].join(" ")}
                  >
                    {step.description || t(`stepDescription${step.id}`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
