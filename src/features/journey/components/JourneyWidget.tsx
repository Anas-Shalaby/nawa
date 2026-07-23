"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle, Lightbulb } from "lucide-react";
import type { EvaluatedPhase } from "../engine/types";
import { JourneyTask } from "./JourneyTask";
import type { Locale } from "@/i18n/routing";

interface JourneyWidgetProps {
  phases: EvaluatedPhase[];
  currentPhaseIndex: number;
}

export function JourneyWidget({ phases, currentPhaseIndex }: JourneyWidgetProps) {
  const t = useTranslations("journey");
  const locale = useLocale() as Locale;
  const isRtl = locale === "ar";
  
  const [isExpanded, setIsExpanded] = useState(true);

  if (currentPhaseIndex >= phases.length) return null; // Fully completed Journey
  const activePhase = phases[currentPhaseIndex];

  const remainingTasks = activePhase.evaluatedSteps.filter((s) => !s.isCompleted).length;

  return (
    <div className="mb-6 rounded-3xl border border-subtle bg-surface shadow-sm overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div 
        className="flex cursor-pointer items-center justify-between p-6 hover:bg-subtle/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
            <Lightbulb className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{t(activePhase.titleKey)}</h2>
            <p className="mt-1 text-sm font-medium text-accent">
              {remainingTasks === 0 ? t("phaseComplete") : t("remainingTasks", { count: remainingTasks })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-muted">
            {t("phaseProgress", { current: currentPhaseIndex + 1, total: phases.length })}
          </div>
          <button className="rounded-full p-2 text-muted hover:bg-subtle hover:text-primary transition-colors">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-subtle p-6 bg-surface/50">
              <div className="flex flex-col gap-3">
                {activePhase.evaluatedSteps.map((step) => (
                  <JourneyTask key={step.id} step={step} isRtl={isRtl} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
