"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChiefComplaintCardProps {
  value: string;
  onChange: (value: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isActive: boolean;
  onFocus: () => void;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Fever / حمى",
  "Headache / صداع",
  "Cough / سعال",
  "Chest Pain / ألم في الصدر",
  "Abdominal Pain / ألم في البطن",
  "Shortness of Breath / ضيق تنفس",
];

export function ChiefComplaintCard({
  value,
  onChange,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onFocus,
  suggestions,
}: ChiefComplaintCardProps) {
  const t = useTranslations("ehr.workspace.visit");
  const activeSuggestions = suggestions ?? DEFAULT_SUGGESTIONS;

  return (
    <motion.section
      layout
      id="visit-cc"
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
      {/* Card Header */}
      <motion.div layout="position" className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
            1
          </span>
          <h2 className="text-sm font-semibold text-primary">{t("step1")}</h2>
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

      {/* Card Body */}
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
            <p className="text-xs text-muted">{t("stepDescription1")}</p>
            
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={onFocus}
              rows={3}
              placeholder={t("ccPlaceholder")}
              className="w-full resize-none rounded-xl border border-subtle bg-elevated/30 px-3 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
            />

            {/* Suggestions */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
                {t("ccSuggest")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const current = value.trim();
                      const separator = current ? " · " : "";
                      onChange(current + separator + s);
                    }}
                    className="rounded-lg bg-elevated px-2 py-1 text-xs font-medium text-muted hover:bg-subtle hover:text-primary transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Collapsed Summary */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-2.5 ps-8.5"
          >
            <p className="text-xs text-primary/80 line-clamp-1 italic">
              {value.trim() ? value : <span className="text-muted/60">{t("none")}</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
