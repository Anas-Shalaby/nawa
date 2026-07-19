"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { saveConsultationNotes } from "@/actions/saveConsultationNotes";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";

interface VisitEditorProps {
  patientId: string;
  currentVisit: PatientVisitRecord | null;
  consultationNotes: string;
  onNotesChange: (notes: string) => void;
  notesDirty: boolean;
  onNotesSaved: () => void;
}

const TEMPLATE_SECTIONS = [
  "chiefComplaint",
  "history",
  "examination",
  "assessment",
  "plan",
] as const;

const TEMPLATE_MARKERS: Record<string, string> = {
  chiefComplaint: "— Chief Complaint / الشكوى الرئيسية —\n",
  history: "— History / التاريخ المرضي —\n",
  examination: "— Examination / الفحص —\n",
  assessment: "— Assessment / التقييم —\n",
  plan: "— Plan / الخطة —\n",
};

export function VisitEditor({
  patientId,
  currentVisit,
  consultationNotes,
  onNotesChange,
  notesDirty,
  onNotesSaved,
}: VisitEditorProps) {
  const tw = useTranslations("ehr.workspace");
  const [isNotesPending, startNotesTransition] = useTransition();
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSaveNotes() {
    startNotesTransition(async () => {
      const result = await saveConsultationNotes({
        patientId,
        notes: consultationNotes,
        appointmentId: currentVisit?.id ?? null,
      });
      if (!result.success) {
        toast.error(tw("notesSaveError"), { description: result.error });
        return;
      }
      onNotesSaved();
      toast.success(tw("notesSaved"));
    });
  }

  const insertTemplate = useCallback(
    (section: string) => {
      const marker = TEMPLATE_MARKERS[section] ?? "";
      const textarea = textareaRef.current;
      if (!textarea) {
        onNotesChange(consultationNotes + (consultationNotes ? "\n\n" : "") + marker);
        setShowTemplateMenu(false);
        toast.success(tw("templateInserted"));
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = consultationNotes.slice(0, start);
      const after = consultationNotes.slice(end);
      const prefix = before.length > 0 && !before.endsWith("\n") ? "\n\n" : "";
      const newValue = before + prefix + marker + after;
      onNotesChange(newValue);
      setShowTemplateMenu(false);
      toast.success(tw("templateInserted"));

      requestAnimationFrame(() => {
        const pos = before.length + prefix.length + marker.length;
        textarea.setSelectionRange(pos, pos);
        textarea.focus();
      });
    },
    [consultationNotes, onNotesChange, tw],
  );

  const insertFullTemplate = useCallback(() => {
    const full = TEMPLATE_SECTIONS.map((s) => TEMPLATE_MARKERS[s]).join("\n");
    const prefix = consultationNotes.length > 0 ? "\n\n" : "";
    onNotesChange(consultationNotes + prefix + full);
    setShowTemplateMenu(false);
    toast.success(tw("templateInserted"));
  }, [consultationNotes, onNotesChange, tw]);

  return (
    <section id="workspace-notes" className="mb-10 text-start">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-primary">{tw("notesTitle")}</h2>
          <p className="mt-1 text-xs text-muted">
            {currentVisit
              ? tw("notesHintVisit", { service: currentVisit.serviceName })
              : tw("notesHintPatient")}
          </p>
        </div>
        <div className="flex items-center gap-2 hide-on-print">
          {/* Template dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-muted transition hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden />
              {tw("insertTemplate")}
            </button>

            <AnimatePresence>
              {showTemplateMenu ? (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute end-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-subtle bg-surface shadow-lg"
                >
                  {TEMPLATE_SECTIONS.map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => insertTemplate(section)}
                      className="block w-full px-3 py-2 text-start text-xs text-primary transition hover:bg-elevated"
                    >
                      {tw(section)}
                    </button>
                  ))}
                  <div className="border-t border-subtle" />
                  <button
                    type="button"
                    onClick={insertFullTemplate}
                    className="block w-full px-3 py-2 text-start text-xs font-medium text-accent transition hover:bg-elevated"
                  >
                    {tw("insertTemplate")} — All
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Save button */}
          <button
            type="button"
            disabled={isNotesPending || !notesDirty}
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {isNotesPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {tw("saveNotes")}
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={consultationNotes}
        onChange={(event) => onNotesChange(event.target.value)}
        rows={12}
        placeholder={tw("notesPlaceholder")}
        className="w-full resize-y rounded-2xl border-0 bg-elevated/50 px-4 py-4 text-base leading-relaxed text-primary placeholder:text-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      />

      {/* Click-outside handler for template menu */}
      {showTemplateMenu ? (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowTemplateMenu(false)}
          aria-hidden
        />
      ) : null}
    </section>
  );
}
