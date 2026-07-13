"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle,
  Pill,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { savePatientPrescription } from "@/actions/savePatientPrescription";
import {
  DOSAGE_OPTIONS,
  DURATION_OPTIONS,
  FREQUENCY_OPTIONS,
  PRESCRIPTION_DRUG_CATALOG,
  PRESCRIPTION_QUICK_TEMPLATES,
} from "@/lib/clinical/prescriptionCatalog";
import { toWhatsAppUrl } from "@/lib/phone/whatsapp";
import type { Locale } from "@/i18n/routing";

export type PrescriptionLine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

interface PrescriptionBuilderProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAgeLabel?: string;
  doctorName: string;
  clinicName: string;
  specialty?: string;
  onSaved?: (formattedText: string) => void;
}

function createLine(
  partial?: Partial<Omit<PrescriptionLine, "id">> & { name: string },
): PrescriptionLine {
  return {
    id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial?.name ?? "",
    dosage: partial?.dosage ?? "قرص",
    frequency: partial?.frequency ?? "كل 12 ساعة",
    duration: partial?.duration ?? "لمدة 5 أيام",
    notes: partial?.notes ?? "",
  };
}

function formatDateLabel(locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date());
}

function buildWhatsAppMessage(
  patientName: string,
  doctorName: string,
  clinicName: string,
  lines: PrescriptionLine[],
  dateLabel: string,
): string {
  const body = lines
    .map(
      (line, index) =>
        `${index + 1}) ${line.name}\n${line.dosage} · ${line.frequency} · ${line.duration}${
          line.notes ? `\nملاحظة: ${line.notes}` : ""
        }`,
    )
    .join("\n\n");

  return [
    `روشتة طبية — ${clinicName}`,
    `المريض: ${patientName}`,
    `الطبيب: ${doctorName}`,
    `التاريخ: ${dateLabel}`,
    ``,
    `Rx`,
    body,
    ``,
    `تم الإصدار تقنياً بواسطة نواة`,
  ].join("\n");
}

export function PrescriptionBuilder({
  open,
  onClose,
  patientId,
  patientName,
  patientPhone,
  patientAgeLabel,
  doctorName,
  clinicName,
  specialty,
  onSaved,
}: PrescriptionBuilderProps) {
  const t = useTranslations("prescription");
  const locale = useLocale() as Locale;
  const searchRef = useRef<HTMLInputElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<PrescriptionLine[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [pending, startTransition] = useTransition();

  const dateLabel = useMemo(() => formatDateLabel(locale), [locale]);
  const displayDoctor =
    doctorName.trim().length > 0
      ? doctorName.startsWith("د")
        ? doctorName
        : `د. ${doctorName}`
      : clinicName;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRESCRIPTION_DRUG_CATALOG.slice(0, 6);
    return PRESCRIPTION_DRUG_CATALOG.filter((drug) =>
      drug.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const addDrug = useCallback((drug: (typeof PRESCRIPTION_DRUG_CATALOG)[number]) => {
    setLines((current) => [...current, createLine(drug)]);
    setQuery("");
    setHighlight(0);
    searchRef.current?.focus();
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = PRESCRIPTION_QUICK_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    setLines((current) => [
      ...current,
      ...template.drugs.map((drug) => createLine(drug)),
    ]);
    toast.success(t("templateApplied"));
  }, [t]);

  function updateLine(id: string, patch: Partial<PrescriptionLine>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(id: string) {
    setLines((current) => current.filter((line) => line.id !== id));
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((value) => Math.min(value + 1, Math.max(suggestions.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[highlight];
      if (picked) addDrug(picked);
      else if (query.trim()) {
        addDrug({
          name: query.trim(),
          dosage: "قرص",
          frequency: "كل 12 ساعة",
          duration: "لمدة 5 أيام",
          notes: "",
        });
      }
    }
  }

  function handlePrint() {
    if (lines.length === 0) {
      toast.error(t("emptyError"));
      return;
    }
    document.body.classList.add("printing-prescription");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("printing-prescription");
    }, 300);
  }

  function handleWhatsApp() {
    if (lines.length === 0) {
      toast.error(t("emptyError"));
      return;
    }
    const message = buildWhatsAppMessage(
      patientName,
      displayDoctor,
      clinicName,
      lines,
      dateLabel,
    );
    const url = `${toWhatsAppUrl(patientPhone)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSave() {
    if (lines.length === 0) {
      toast.error(t("emptyError"));
      return;
    }
    startTransition(async () => {
      const result = await savePatientPrescription({
        patientId,
        doctorName: displayDoctor,
        dateLabel,
        lines: lines.map(({ name, dosage, frequency, duration, notes }) => ({
          name,
          dosage,
          frequency,
          duration,
          notes,
        })),
      });
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      toast.success(t("saveSuccess"));
      onSaved?.(result.formattedText ?? "");
      onClose();
    });
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @media print {
              body.printing-prescription * {
                visibility: hidden !important;
              }
              body.printing-prescription #nawa-prescription-paper,
              body.printing-prescription #nawa-prescription-paper * {
                visibility: visible !important;
              }
              body.printing-prescription #nawa-prescription-paper {
                position: fixed !important;
                inset: 0 !important;
                width: 210mm !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `,
            }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="prescription-builder-root fixed inset-0 z-[220] flex flex-col bg-base/80 backdrop-blur-md"
            dir="rtl"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-3 sm:px-6">
              <div className="text-start">
                <p className="text-xs text-muted">{clinicName}</p>
                <h2 className="text-base font-semibold text-primary">{t("title")}</h2>
                <p className="text-xs text-muted">
                  {t("forPatient", { name: patientName })}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-subtle p-2 text-muted transition hover:bg-elevated hover:text-primary"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden p-4 sm:p-6 lg:grid-cols-2 lg:gap-8">
              {/* Input engine — RTL first = right */}
              <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-subtle bg-surface">
                <div className="shrink-0 space-y-3 border-b border-subtle p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setHighlight(0);
                      }}
                      onKeyDown={onSearchKeyDown}
                      placeholder={t("searchPlaceholder")}
                      className="h-12 w-full rounded-xl border border-subtle bg-elevated/50 pe-3 ps-10 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>

                  {query.trim() || suggestions.length > 0 ? (
                    <ul className="max-h-40 overflow-y-auto rounded-xl border border-subtle bg-elevated/40">
                      {suggestions.map((drug, index) => (
                        <li key={drug.name}>
                          <button
                            type="button"
                            onClick={() => addDrug(drug)}
                            className={[
                              "flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition",
                              index === highlight
                                ? "bg-accent/15 text-accent"
                                : "text-primary hover:bg-elevated",
                            ].join(" ")}
                          >
                            <Pill className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {drug.name}
                          </button>
                        </li>
                      ))}
                      {suggestions.length === 0 && query.trim() ? (
                        <li>
                          <button
                            type="button"
                            onClick={() =>
                              addDrug({
                                name: query.trim(),
                                dosage: "قرص",
                                frequency: "كل 12 ساعة",
                                duration: "لمدة 5 أيام",
                                notes: "",
                              })
                            }
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-accent hover:bg-elevated"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            {t("addCustom", { name: query.trim() })}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  ) : null}

                  <div className="flex flex-wrap gap-1.5">
                    {PRESCRIPTION_QUICK_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template.id)}
                        className="rounded-full border border-subtle bg-elevated px-3 py-1 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-accent"
                      >
                        {locale === "ar" ? template.labelAr : template.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  {lines.length === 0 ? (
                    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-subtle text-center">
                      <Pill className="mb-2 h-8 w-8 text-muted" aria-hidden />
                      <p className="text-sm text-muted">{t("emptyList")}</p>
                    </div>
                  ) : (
                    lines.map((line, index) => (
                      <article
                        key={line.id}
                        className="rounded-xl border border-subtle bg-elevated/40 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-primary">
                            {index + 1}. {line.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="rounded-lg p-1.5 text-muted transition hover:bg-accent-danger/10 hover:text-accent-danger"
                            aria-label={t("removeDrug")}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="block text-start">
                            <span className="mb-1 block text-[10px] text-muted">
                              {t("dosage")}
                            </span>
                            <select
                              value={line.dosage}
                              onChange={(event) =>
                                updateLine(line.id, { dosage: event.target.value })
                              }
                              className="h-9 w-full rounded-lg border border-subtle bg-surface px-2 text-xs text-primary focus:border-accent focus:outline-none"
                            >
                              {DOSAGE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-start">
                            <span className="mb-1 block text-[10px] text-muted">
                              {t("frequency")}
                            </span>
                            <select
                              value={line.frequency}
                              onChange={(event) =>
                                updateLine(line.id, { frequency: event.target.value })
                              }
                              className="h-9 w-full rounded-lg border border-subtle bg-surface px-2 text-xs text-primary focus:border-accent focus:outline-none"
                            >
                              {FREQUENCY_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-start">
                            <span className="mb-1 block text-[10px] text-muted">
                              {t("duration")}
                            </span>
                            <select
                              value={line.duration}
                              onChange={(event) =>
                                updateLine(line.id, { duration: event.target.value })
                              }
                              className="h-9 w-full rounded-lg border border-subtle bg-surface px-2 text-xs text-primary focus:border-accent focus:outline-none"
                            >
                              {DURATION_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-start">
                            <span className="mb-1 block text-[10px] text-muted">
                              {t("notes")}
                            </span>
                            <input
                              value={line.notes}
                              onChange={(event) =>
                                updateLine(line.id, { notes: event.target.value })
                              }
                              placeholder={t("notesPlaceholder")}
                              className="h-9 w-full rounded-lg border border-subtle bg-surface px-2 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                            />
                          </label>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              {/* Live paper — always light */}
              <section className="flex min-h-0 items-center justify-center overflow-auto rounded-2xl bg-gray-100 p-4 sm:p-8">
                <div
                  ref={paperRef}
                  id="nawa-prescription-paper"
                  className="relative aspect-[1/1.414] w-full max-w-[420px] overflow-hidden bg-white p-6 text-[#111827] shadow-2xl sm:p-8"
                  dir="rtl"
                >
                  <div className="pointer-events-none absolute -start-2 top-24 select-none font-serif text-[120px] leading-none text-accent/10">
                    Rx
                  </div>

                  <header className="relative z-10 border-b border-gray-200 pb-4 text-start">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        ن
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900">
                          {displayDoctor}
                        </p>
                        <p className="text-xs text-gray-500">
                          {specialty?.trim() || clinicName}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-1 text-[11px] text-gray-600 sm:grid-cols-3">
                      <p>
                        <span className="text-gray-400">{t("paperPatient")}: </span>
                        {patientName}
                      </p>
                      <p>
                        <span className="text-gray-400">{t("paperAge")}: </span>
                        {patientAgeLabel ?? t("paperAgeUnknown")}
                      </p>
                      <p>
                        <span className="text-gray-400">{t("paperDate")}: </span>
                        {dateLabel}
                      </p>
                    </div>
                  </header>

                  <div className="relative z-10 mt-5 min-h-[50%] space-y-4 text-start">
                    {lines.length === 0 ? (
                      <p className="pt-10 text-center text-sm text-gray-400">
                        {t("paperEmpty")}
                      </p>
                    ) : (
                      lines.map((line, index) => (
                        <div key={line.id} className="border-b border-gray-100 pb-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {index + 1}. {line.name}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-gray-600">
                            {line.dosage} · {line.frequency} · {line.duration}
                            {line.notes ? ` — ${line.notes}` : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <footer className="absolute inset-x-6 bottom-6 z-10 sm:inset-x-8">
                    <div className="mb-6 flex justify-end">
                      <div className="w-40 border-t border-gray-300 pt-2 text-center text-[10px] text-gray-500">
                        {t("signature")}
                      </div>
                    </div>
                    <p className="text-center text-[10px] text-gray-400">
                      {clinicName}
                    </p>
                    <p className="mt-1 text-center text-[10px] font-medium text-accent">
                      تم الإصدار تقنياً بواسطة نواة ✦
                    </p>
                  </footer>
                </div>
              </section>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-subtle bg-surface px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-elevated px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-accent/40 hover:text-accent"
              >
                <Printer className="h-4 w-4" aria-hidden />
                {t("print")}
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 rounded-xl border border-accent-success/30 bg-accent-success/15 px-4 py-2.5 text-sm font-semibold text-accent-success transition hover:bg-accent-success/25"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t("whatsapp")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                <Save className="h-4 w-4" aria-hidden />
                {pending ? t("saving") : t("save")}
              </button>
            </footer>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
