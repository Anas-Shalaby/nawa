"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VitalsData {
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  weight: string;
}

interface ClinicalExamProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  vitals: VitalsData;
  onVitalsChange: (vitals: VitalsData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function ClinicalExam({
  notes,
  onNotesChange,
  vitals,
  onVitalsChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: ClinicalExamProps) {
  const t = useTranslations("ehr.workspace.visit");
  const [showVitals, setShowVitals] = useState(false);

  function handleVitalChange(field: keyof VitalsData, val: string) {
    onVitalsChange({
      ...vitals,
      [field]: val,
    });
  }

  // Generate collapsed summary label
  const vitalsSummary = [
    vitals.heartRate && `HR: ${vitals.heartRate}`,
    vitals.bloodPressure && `BP: ${vitals.bloodPressure}`,
    vitals.temperature && `Temp: ${vitals.temperature}°C`,
    vitals.weight && `Wt: ${vitals.weight}kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  const collapsedSummary = [
    vitalsSummary && `Vitals: ${vitalsSummary}`,
    notes.trim() && `Exam: ${notes.trim().slice(0, 40)}...`,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Card
      id="visit-exam"
      onClick={() => {
        if (isCollapsed) {
          onFocus();
        }
      }}
      className={[
        "transition-all duration-300 text-start overflow-hidden",
        isActive
          ? "border-accent ring-1 ring-accent/20 shadow-md premium-glow bg-surface/90"
          : "border-subtle/50 bg-surface/40 hover:border-subtle hover:shadow-sm",
        isCollapsed ? "cursor-pointer opacity-80 hover:opacity-100" : "",
      ].join(" ")}
    >
      <CardHeader className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Badge variant={isActive ? "premium" : "secondary"} className="h-7 w-7 rounded-lg flex items-center justify-center p-0 text-sm">
            3
          </Badge>
          <h2 className="text-sm font-semibold text-primary">{t("step3")}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="h-8 w-8 text-muted hide-on-print"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!isCollapsed ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="p-4 md:p-5 pt-0 space-y-5">
              <p className="text-xs text-muted">{t("stepDescription3")}</p>

              {/* Vitals expander */}
              <div className="rounded-xl border border-subtle bg-elevated/20 p-1">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowVitals((v) => !v);
                    onFocus();
                  }}
                  className="w-full justify-between hover:bg-transparent h-10 px-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="h-4 w-4 text-accent" />
                    {t("examVitals")}
                    {vitalsSummary && <span className="text-[11px] font-normal text-muted hidden sm:inline-block ml-2">({vitalsSummary})</span>}
                  </span>
                  <span className="text-xs text-muted">{showVitals ? t("collapseRx") : t("insertTemplate")}</span>
                </Button>

                <AnimatePresence>
                  {showVitals && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {t("vitalHR")}
                          </label>
                          <input
                            type="text"
                            value={vitals.heartRate}
                            onChange={(e) => handleVitalChange("heartRate", e.target.value)}
                            onFocus={onFocus}
                            placeholder="e.g. 72"
                            dir="ltr"
                            className="flex h-9 w-full rounded-md border border-subtle bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {t("vitalBP")}
                          </label>
                          <input
                            type="text"
                            value={vitals.bloodPressure}
                            onChange={(e) => handleVitalChange("bloodPressure", e.target.value)}
                            onFocus={onFocus}
                            placeholder="e.g. 120/80"
                            dir="ltr"
                            className="flex h-9 w-full rounded-md border border-subtle bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {t("vitalTemp")}
                          </label>
                          <input
                            type="text"
                            value={vitals.temperature}
                            onChange={(e) => handleVitalChange("temperature", e.target.value)}
                            onFocus={onFocus}
                            placeholder="e.g. 37.0"
                            dir="ltr"
                            className="flex h-9 w-full rounded-md border border-subtle bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {t("vitalWeight")}
                          </label>
                          <input
                            type="text"
                            value={vitals.weight}
                            onChange={(e) => handleVitalChange("weight", e.target.value)}
                            onFocus={onFocus}
                            placeholder="e.g. 70"
                            dir="ltr"
                            className="flex h-9 w-full rounded-md border border-subtle bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Exam notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {t("examNotes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  onFocus={onFocus}
                  rows={4}
                  placeholder={t("examNotesPlaceholder")}
                  className="flex min-h-[80px] w-full rounded-md border border-subtle bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </CardContent>
          </motion.div>
        ) : (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="p-4 md:p-5 pt-0 ps-12 md:ps-[3.25rem]">
              <p className="text-sm text-primary/80 line-clamp-1 italic">
                {collapsedSummary || <span className="text-muted">{t("none")}</span>}
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
