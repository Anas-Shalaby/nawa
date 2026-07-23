"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryData {
  presentIllness: string;
  pastMedical: string;
  drug: string;
  family: string;
  social: string;
}

interface HistoryEditorProps {
  value: HistoryData;
  onChange: (value: HistoryData) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export function HistoryEditor({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
}: HistoryEditorProps) {
  const t = useTranslations("ehr.workspace.visit");
  const [activeSection, setActiveSection] = useState<keyof HistoryData>("presentIllness");

  function handleFieldChange(field: keyof HistoryData, text: string) {
    onChange({
      ...value,
      [field]: text,
    });
  }

  const sections: { key: keyof HistoryData; label: string }[] = [
    { key: "presentIllness", label: t("historyHPI") },
    { key: "pastMedical", label: t("historyPast") },
    { key: "drug", label: t("historyDrug") },
    { key: "family", label: t("historyFamily") },
    { key: "social", label: t("historySocial") },
  ];

  const summaryText = sections
    .filter((s) => value[s.key].trim().length > 0)
    .map((s) => `${s.label}: ${value[s.key].trim().slice(0, 30)}...`)
    .join(" · ");

  return (
    <motion.section
      layout
      id="visit-history"
      onClick={() => {
        if (isCollapsed) {
          onFocus();
        }
      }}
      className={[
        "rounded-2xl border bg-surface/40 p-5 transition-all duration-200 text-start overflow-hidden",
        isActive
          ? "border-accent ring-1 ring-accent/20"
          : "border-subtle/70 hover:border-subtle",
        isCollapsed ? "cursor-pointer" : "",
      ].join(" ")}
    >
      <motion.div layout="position" className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            2
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("step2")}</h2>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="rounded-lg p-1 text-muted hover:bg-elevated hover:text-primary hide-on-print"
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>
      </motion.div>

      <AnimatePresence initial={false} mode="popLayout">
        {!isCollapsed ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-4 space-y-4"
          >
            <p className="text-xs text-muted">{t("stepDescription2")}</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 border-subtle md:border-s md:border-subtle/50 ps-0 md:ps-3 md:order-1 order-none">
                {sections.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setActiveSection(s.key);
                      onFocus();
                    }}
                    className={[
                      "whitespace-nowrap px-3 py-1.5 text-xs text-start font-medium rounded-lg transition",
                      activeSection === s.key
                        ? "bg-accent/15 text-accent md:bg-transparent md:text-accent md:font-semibold"
                        : "text-muted hover:bg-elevated hover:text-primary",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="md:col-span-3">
                <textarea
                  value={value[activeSection]}
                  onChange={(e) => handleFieldChange(activeSection, e.target.value)}
                  onFocus={onFocus}
                  rows={5}
                  placeholder={t("historyPlaceholder")}
                  className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-2.5 ps-8.5"
          >
            <p className="text-xs text-primary/80 line-clamp-1 italic">
              {summaryText || <span className="text-muted/60">{t("none")}</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
