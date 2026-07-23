"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, Clock, ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { EvaluatedStep } from "../engine/types";

interface JourneyTaskProps {
  step: EvaluatedStep;
  isRtl: boolean;
}

export function JourneyTask({ step, isRtl }: JourneyTaskProps) {
  const t = useTranslations("journey");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all sm:flex-row sm:items-center sm:justify-between ${
        step.isCompleted
          ? "border-accent/20 bg-accent/5"
          : step.isLocked
          ? "border-subtle/50 bg-surface/50 opacity-60"
          : "border-subtle bg-surface hover:border-accent/40 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 shrink-0">
          {step.isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </motion.div>
          ) : (
            <Circle className="h-6 w-6 text-muted" />
          )}
        </div>

        <div>
          <h4 className={`text-base font-semibold ${step.isCompleted ? "text-primary/70 line-through" : "text-primary"}`}>
            {t(step.titleKey)}
          </h4>
          <p className="mt-1 text-sm text-muted max-w-lg">{t(step.descKey)}</p>

          {!step.isCompleted && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {step.estimatedMinutes} {t("minutes")}
              </span>
            </div>
          )}
        </div>
      </div>

      {!step.isCompleted && !step.isLocked && (
        <div className="shrink-0 sm:self-center">
          <Button asChild variant="contrast" className="gap-2">
            <Link href={step.actionPath}>
              {t("doTask")}
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
