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
  BookmarkPlus,
  Copy,
  MessageCircle,
  Pill,
  Plus,
  Printer,
  Save,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  savePrescriptionAsTemplate,
  toggleMedicineFavorite,
} from "@/actions/managePrescriptionExtras";
import { savePatientPrescription } from "@/actions/savePatientPrescription";
import { PrescriptionPaper } from "@/components/clinical/PrescriptionPaper";
import {
  CHRONIC_DURATION_OPTIONS,
  DOSE_AMOUNT_OPTIONS,
  DURATION_OPTIONS,
  FORM_OPTIONS,
  FREQUENCY_OPTIONS,
  NOTE_PRESETS,
  PRESCRIPTION_DRUG_CATALOG,
  PRESCRIPTION_QUICK_TEMPLATES,
  type CatalogDrug,
} from "@/lib/clinical/prescriptionCatalog";
import { buildPrescriptionWhatsAppMessage } from "@/lib/clinical/prescriptionFormat";
import type {
  ChronicMedicationRecord,
  MedicineFavoriteRecord,
  PrescriptionLineDraft,
  PrescriptionLineInput,
  PrescriptionRecord,
  PrescriptionTemplateRecord,
} from "@/lib/clinical/prescriptionTypes";
import { toWhatsAppUrl } from "@/lib/phone/whatsapp";
import type { Locale } from "@/i18n/routing";

type SourceTab = "search" | "favorites" | "previous" | "templates" | "chronic";
type BuilderStep = "amount" | "form" | "frequency" | "duration" | "notes";

const STEPS: BuilderStep[] = ["amount", "form", "frequency", "duration", "notes"];

interface PrescriptionBuilderProps {
  open: boolean;
  onClose: () => void;
  /** modal = fullscreen overlay; inline = expands in-page (Patient Workspace). */
  layout?: "modal" | "inline";
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAgeLabel?: string;
  doctorName: string;
  clinicName: string;
  specialty?: string;
  clinicPhone?: string;
  clinicLocation?: string;
  logoUrl?: string | null;
  previousPrescriptions?: PrescriptionRecord[];
  favorites?: MedicineFavoriteRecord[];
  clinicTemplates?: PrescriptionTemplateRecord[];
  chronicMedications?: ChronicMedicationRecord[];
  onSaved?: (payload: {
    formattedText: string;
    prescriptionId?: string;
    publicToken?: string;
    lines: PrescriptionLineInput[];
  }) => void;
}

function createLineId(): string {
  return `rx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function draftFromPartial(
  partial: Partial<PrescriptionLineDraft> & { medicineName: string },
): PrescriptionLineDraft {
  return {
    id: createLineId(),
    medicineName: partial.medicineName,
    doseAmount: partial.doseAmount ?? "1",
    form: partial.form ?? "قرص",
    frequency: partial.frequency ?? "مرتين يومياً",
    duration: partial.duration ?? "لمدة 5 أيام",
    notes: partial.notes ?? "",
    isChronic: partial.isChronic ?? false,
    isCustom: partial.isCustom ?? false,
  };
}

function toInput(line: PrescriptionLineDraft): PrescriptionLineInput {
  return {
    medicineName: line.medicineName,
    doseAmount: line.doseAmount,
    form: line.form,
    frequency: line.frequency,
    duration: line.duration,
    notes: line.notes,
    isChronic: line.isChronic,
    isCustom: line.isCustom,
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

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              active
                ? "border-accent bg-accent text-white"
                : "border-subtle bg-surface text-primary hover:border-accent/40",
            ].join(" ")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function PrescriptionBuilder({
  open,
  onClose,
  layout = "modal",
  patientId,
  patientName,
  patientPhone,
  patientAgeLabel,
  doctorName,
  clinicName,
  specialty,
  clinicPhone,
  clinicLocation,
  logoUrl,
  previousPrescriptions = [],
  favorites: initialFavorites = [],
  clinicTemplates = [],
  chronicMedications = [],
  onSaved,
}: PrescriptionBuilderProps) {
  const isInline = layout === "inline";
  const t = useTranslations("prescription");
  const locale = useLocale() as Locale;
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<PrescriptionLineDraft[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [tab, setTab] = useState<SourceTab>("search");
  const [step, setStep] = useState<BuilderStep>("amount");
  const [draft, setDraft] = useState<PrescriptionLineDraft | null>(null);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [duplicatedFromId, setDuplicatedFromId] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [pending, startTransition] = useTransition();
  const [templatePending, startTemplateTransition] = useTransition();

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
    setTab("search");
    setStep("amount");
    setDraft(null);
    setLines([]);
    setDuplicatedFromId(null);
    setPreviewToken(crypto.randomUUID());
    setFavorites(initialFavorites);
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80);
    const previousOverflow = document.body.style.overflow;
    if (!isInline) {
      document.body.style.overflow = "hidden";
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      if (!isInline) {
        document.body.style.overflow = previousOverflow;
      }
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, initialFavorites, isInline]);

  const catalogMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRESCRIPTION_DRUG_CATALOG.slice(0, 8);
    return PRESCRIPTION_DRUG_CATALOG.filter((drug) =>
      drug.name.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [query]);

  const favoriteNames = useMemo(
    () => new Set(favorites.map((item) => item.medicineName.toLowerCase())),
    [favorites],
  );

  const startDraftFromDrug = useCallback((drug: CatalogDrug, isCustom = false) => {
    setDraft(
      draftFromPartial({
        medicineName: drug.name,
        doseAmount: drug.doseAmount,
        form: drug.form,
        frequency: drug.frequency,
        duration: drug.duration,
        notes: drug.notes,
        isCustom,
      }),
    );
    setStep("amount");
    setQuery("");
  }, []);

  const commitDraft = useCallback(() => {
    if (!draft?.medicineName.trim()) return;
    setLines((current) => [...current, { ...draft, id: createLineId() }]);
    setDraft(null);
    setStep("amount");
    searchRef.current?.focus();
  }, [draft]);

  const updateDraft = useCallback((patch: Partial<PrescriptionLineDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const applyLines = useCallback((incoming: PrescriptionLineInput[], fromId?: string) => {
    setLines(
      incoming.map((line) =>
        draftFromPartial({
          medicineName: line.medicineName,
          doseAmount: line.doseAmount,
          form: line.form,
          frequency: line.frequency,
          duration: line.duration,
          notes: line.notes,
          isChronic: line.isChronic,
          isCustom: line.isCustom,
        }),
      ),
    );
    setDuplicatedFromId(fromId ?? null);
    setDraft(null);
    toast.success(t("templateApplied"));
  }, [t]);

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((value) => Math.min(value + 1, catalogMatches.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (highlight < catalogMatches.length) {
        const drug = catalogMatches[highlight];
        if (drug) startDraftFromDrug(drug);
        return;
      }
      if (query.trim()) {
        startDraftFromDrug(
          {
            name: query.trim(),
            doseAmount: "1",
            form: "قرص",
            frequency: "مرتين يومياً",
            duration: "لمدة 5 أيام",
            notes: "",
          },
          true,
        );
      }
    }
  }

  function handlePrint() {
    if (!lines.length) {
      toast.error(t("emptyError"));
      return;
    }
    document.body.classList.add("printing-prescription");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("printing-prescription");
    }, 400);
  }

  function handleWhatsApp() {
    if (!lines.length) {
      toast.error(t("emptyError"));
      return;
    }
    const message = buildPrescriptionWhatsAppMessage({
      patientName,
      doctorName: displayDoctor,
      clinicName,
      dateLabel,
      lines: lines.map(toInput),
    });
    window.open(
      `${toWhatsAppUrl(patientPhone)}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleSave() {
    if (!lines.length) {
      toast.error(t("emptyError"));
      return;
    }
    startTransition(async () => {
      const result = await savePatientPrescription({
        patientId,
        doctorName: displayDoctor,
        clinicName,
        specialty,
        dateLabel,
        lines: lines.map(toInput),
        duplicatedFromId,
      });
      if (!result.success) {
        toast.error(result.error ?? t("saveError"));
        return;
      }
      if (result.publicToken) setPreviewToken(result.publicToken);
      toast.success(t("saveSuccess"));
      onSaved?.({
        formattedText: result.formattedText ?? "",
        prescriptionId: result.prescriptionId,
        publicToken: result.publicToken,
        lines: lines.map(toInput),
      });
      onClose();
    });
  }

  function handleSaveTemplate() {
    if (!lines.length) {
      toast.error(t("emptyError"));
      return;
    }
    const name = window.prompt(t("templateNamePrompt"));
    if (!name?.trim()) return;
    startTemplateTransition(async () => {
      const result = await savePrescriptionAsTemplate({
        name: name.trim(),
        lines: lines.map(toInput),
      });
      if (!result.success) {
        toast.error(result.error ?? t("templateSaveError"));
        return;
      }
      toast.success(t("templateSaveSuccess"));
    });
  }

  async function handleToggleFavorite(line: PrescriptionLineDraft | PrescriptionLineInput) {
    const name = line.medicineName;
    const isFav = favoriteNames.has(name.toLowerCase());
    const result = await toggleMedicineFavorite({
      medicineName: name,
      doseAmount: line.doseAmount,
      form: line.form,
      frequency: line.frequency,
      duration: line.duration,
      notes: line.notes,
      favorite: !isFav,
    });
    if (!result.success) {
      toast.error(result.error ?? t("favoriteError"));
      return;
    }
    setFavorites((current) => {
      if (isFav) {
        return current.filter(
          (item) => item.medicineName.toLowerCase() !== name.toLowerCase(),
        );
      }
      return [
        ...current,
        {
          id: result.id ?? createLineId(),
          medicineName: name,
          doseAmount: line.doseAmount,
          form: line.form,
          frequency: line.frequency,
          duration: line.duration,
          notes: line.notes,
        },
      ];
    });
    toast.success(isFav ? t("favoriteRemoved") : t("favoriteAdded"));
  }

  const durationOptions = draft?.isChronic
    ? [...DURATION_OPTIONS, ...CHRONIC_DURATION_OPTIONS]
    : DURATION_OPTIONS;

  const stepIndex = STEPS.indexOf(step);

  if (!mounted || !open) return null;

  const paper = (
    <PrescriptionPaper
      clinicName={clinicName}
      doctorName={displayDoctor}
      specialty={specialty}
      clinicPhone={clinicPhone}
      clinicLocation={clinicLocation}
      logoUrl={logoUrl}
      patientName={patientName}
      patientAgeLabel={patientAgeLabel}
      dateLabel={dateLabel}
      lines={lines.map(toInput)}
      publicToken={previewToken}
    />
  );

  const panelClass = isInline
    ? "relative flex min-h-[36rem] max-h-[min(80vh,56rem)] w-full flex-col overflow-hidden rounded-2xl border border-subtle bg-base"
    : "fixed inset-2 z-[221] flex flex-col overflow-hidden rounded-2xl border border-subtle bg-base shadow-2xl sm:inset-4 lg:inset-6";

  const shell = (
        <>
          <style>{`
            @media print {
              body.printing-prescription * { visibility: hidden !important; }
              body.printing-prescription #nawa-prescription-paper,
              body.printing-prescription #nawa-prescription-paper * {
                visibility: visible !important;
              }
              body.printing-prescription #nawa-prescription-paper {
                position: fixed !important;
                inset: 0 !important;
                width: 210mm !important;
                max-width: 210mm !important;
                height: 297mm !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}</style>
          {!isInline ? (
          <motion.div
            className="fixed inset-0 z-[220] bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          ) : null}
          <motion.div
            role="dialog"
            aria-modal={!isInline}
            aria-label={t("title")}
            className={panelClass}
            initial={{ opacity: 0, y: isInline ? 8 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            dir="rtl"
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-3 sm:px-6">
              <div className="min-w-0 text-start">
                <p className="text-xs text-muted">{clinicName}</p>
                <h1 className="truncate text-lg font-semibold text-primary">
                  {t("title")}
                </h1>
                <p className="truncate text-sm text-muted">
                  {t("forPatient", { name: patientName })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-subtle px-3 py-2 text-xs font-medium text-primary lg:hidden"
                  onClick={() => setShowPreviewMobile((value) => !value)}
                >
                  {showPreviewMobile ? t("hidePreview") : t("showPreview")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-subtle text-muted transition hover:text-primary"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
              <section
                className={[
                  "min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-5",
                  showPreviewMobile ? "hidden lg:flex" : "flex",
                ].join(" ")}
              >
                <div className="flex flex-wrap gap-1 rounded-xl border border-subtle bg-elevated/40 p-1">
                  {(
                    [
                      ["search", t("tabs.search")],
                      ["favorites", t("tabs.favorites")],
                      ["previous", t("tabs.previous")],
                      ["templates", t("tabs.templates")],
                      ["chronic", t("tabs.chronic")],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={[
                        "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                        tab === id
                          ? "bg-surface text-accent shadow-sm"
                          : "text-muted hover:text-primary",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === "search" ? (
                  <div className="space-y-2">
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
                        className="h-11 w-full rounded-xl border border-subtle bg-surface pe-3 ps-10 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                      />
                    </div>
                    <ul className="overflow-hidden rounded-xl border border-subtle bg-surface">
                      {catalogMatches.map((drug, index) => (
                        <li key={drug.name}>
                          <button
                            type="button"
                            onClick={() => startDraftFromDrug(drug)}
                            className={[
                              "flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm transition",
                              highlight === index
                                ? "bg-accent/10 text-accent"
                                : "text-primary hover:bg-elevated/60",
                            ].join(" ")}
                          >
                            <Pill className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{drug.name}</span>
                          </button>
                        </li>
                      ))}
                      {query.trim() ? (
                        <li>
                          <button
                            type="button"
                            onClick={() =>
                              startDraftFromDrug(
                                {
                                  name: query.trim(),
                                  doseAmount: "1",
                                  form: "قرص",
                                  frequency: "مرتين يومياً",
                                  duration: "لمدة 5 أيام",
                                  notes: "",
                                },
                                true,
                              )
                            }
                            className={[
                              "flex w-full items-center gap-2 border-t border-subtle px-3 py-2.5 text-start text-sm",
                              highlight === catalogMatches.length
                                ? "bg-accent/10 text-accent"
                                : "text-muted hover:bg-elevated/60",
                            ].join(" ")}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t("addCustom", { name: query.trim() })}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {tab === "favorites" ? (
                  <div className="space-y-2">
                    {favorites.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-subtle px-3 py-8 text-center text-sm text-muted">
                        {t("favoritesEmpty")}
                      </p>
                    ) : (
                      favorites.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            startDraftFromDrug({
                              name: item.medicineName,
                              doseAmount: item.doseAmount,
                              form: item.form,
                              frequency: item.frequency,
                              duration: item.duration,
                              notes: item.notes,
                            })
                          }
                          className="flex w-full items-center justify-between rounded-xl border border-subtle bg-surface px-3 py-2.5 text-start text-sm hover:border-accent/40"
                        >
                          <span className="font-medium text-primary">
                            {item.medicineName}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                {tab === "previous" ? (
                  <div className="space-y-2">
                    {previousPrescriptions.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-subtle px-3 py-8 text-center text-sm text-muted">
                        {t("previousEmpty")}
                      </p>
                    ) : (
                      previousPrescriptions.map((rx) => (
                        <article
                          key={rx.id}
                          className="rounded-xl border border-subtle bg-surface p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs text-muted">
                              {new Intl.DateTimeFormat(
                                locale === "ar" ? "ar-EG" : "en-EG",
                                {
                                  dateStyle: "medium",
                                  timeZone: "Africa/Cairo",
                                },
                              ).format(new Date(rx.createdAt))}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                applyLines(
                                  rx.lines.map((line) => ({
                                    medicineName: line.medicineName,
                                    doseAmount: line.doseAmount,
                                    form: line.form,
                                    frequency: line.frequency,
                                    duration: line.duration,
                                    notes: line.notes,
                                    isChronic: line.isChronic,
                                    isCustom: line.isCustom,
                                  })),
                                  rx.id,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-subtle px-2 py-1 text-[11px] font-semibold text-accent"
                            >
                              <Copy className="h-3 w-3" />
                              {t("duplicate")}
                            </button>
                          </div>
                          <ul className="space-y-1 text-xs text-primary">
                            {rx.lines.slice(0, 4).map((line) => (
                              <li key={line.id}>• {line.medicineName}</li>
                            ))}
                            {rx.lines.length > 4 ? (
                              <li className="text-muted">
                                {t("moreLines", { count: rx.lines.length - 4 })}
                              </li>
                            ) : null}
                          </ul>
                        </article>
                      ))
                    )}
                  </div>
                ) : null}

                {tab === "templates" ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {t("systemTemplates")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PRESCRIPTION_QUICK_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() =>
                              applyLines(
                                template.drugs.map((drug) => ({
                                  medicineName: drug.name,
                                  doseAmount: drug.doseAmount,
                                  form: drug.form,
                                  frequency: drug.frequency,
                                  duration: drug.duration,
                                  notes: drug.notes,
                                  isChronic: false,
                                  isCustom: false,
                                })),
                              )
                            }
                            className="rounded-full border border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-primary hover:border-accent/40"
                          >
                            {locale === "ar" ? template.labelAr : template.labelEn}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {t("clinicTemplates")}
                      </p>
                      {clinicTemplates.length === 0 ? (
                        <p className="text-sm text-muted">{t("clinicTemplatesEmpty")}</p>
                      ) : (
                        <div className="space-y-2">
                          {clinicTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => applyLines(template.lines)}
                              className="flex w-full items-center justify-between rounded-xl border border-subtle bg-surface px-3 py-2.5 text-start text-sm hover:border-accent/40"
                            >
                              <span className="font-medium text-primary">
                                {template.name}
                              </span>
                              <span className="text-xs text-muted">
                                {t("lineCount", { count: template.lines.length })}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {tab === "chronic" ? (
                  <div className="space-y-2">
                    {chronicMedications.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-subtle px-3 py-8 text-center text-sm text-muted">
                        {t("chronicEmpty")}
                      </p>
                    ) : (
                      chronicMedications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            startDraftFromDrug(
                              {
                                name: item.medicineName,
                                doseAmount: item.doseAmount,
                                form: item.form,
                                frequency: item.frequency,
                                duration: item.duration || "استمرار",
                                notes: item.notes,
                              },
                            )
                          }
                          className="w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-start text-sm hover:border-accent/40"
                        >
                          <p className="font-medium text-primary">{item.medicineName}</p>
                          <p className="text-xs text-muted">
                            {item.doseAmount} {item.form} · {item.frequency}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}

                {draft ? (
                  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {t("dosageBuilder")}
                        </p>
                        <p className="text-base font-semibold text-primary">
                          {draft.medicineName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraft(null)}
                        className="text-muted hover:text-primary"
                        aria-label={t("close")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-3 flex gap-1">
                      {STEPS.map((item, index) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setStep(item)}
                          className={[
                            "h-1.5 flex-1 rounded-full transition",
                            index <= stepIndex ? "bg-accent" : "bg-elevated",
                          ].join(" ")}
                          aria-label={t(`steps.${item}`)}
                        />
                      ))}
                    </div>

                    <p className="mb-2 text-xs font-medium text-muted">
                      {t(`steps.${step}`)}
                    </p>

                    {step === "amount" ? (
                      <ChipRow
                        options={DOSE_AMOUNT_OPTIONS}
                        value={draft.doseAmount}
                        onChange={(doseAmount) => updateDraft({ doseAmount })}
                      />
                    ) : null}
                    {step === "form" ? (
                      <ChipRow
                        options={FORM_OPTIONS}
                        value={draft.form}
                        onChange={(form) => updateDraft({ form })}
                      />
                    ) : null}
                    {step === "frequency" ? (
                      <ChipRow
                        options={FREQUENCY_OPTIONS}
                        value={draft.frequency}
                        onChange={(frequency) => updateDraft({ frequency })}
                      />
                    ) : null}
                    {step === "duration" ? (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs text-primary">
                          <input
                            type="checkbox"
                            checked={draft.isChronic}
                            onChange={(event) => {
                              const isChronic = event.target.checked;
                              updateDraft({
                                isChronic,
                                duration: isChronic
                                  ? "لمدة شهر"
                                  : draft.duration || "لمدة 5 أيام",
                              });
                            }}
                            className="rounded border-subtle"
                          />
                          {t("markChronic")}
                        </label>
                        <ChipRow
                          options={durationOptions}
                          value={draft.duration}
                          onChange={(duration) => updateDraft({ duration })}
                        />
                      </div>
                    ) : null}
                    {step === "notes" ? (
                      <div className="space-y-2">
                        <ChipRow
                          options={NOTE_PRESETS}
                          value={draft.notes}
                          onChange={(notes) => updateDraft({ notes })}
                        />
                        <input
                          value={draft.notes}
                          onChange={(event) =>
                            updateDraft({ notes: event.target.value })
                          }
                          placeholder={t("notesPlaceholder")}
                          className="h-10 w-full rounded-xl border border-subtle bg-surface px-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none"
                        />
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {stepIndex > 0 ? (
                        <button
                          type="button"
                          onClick={() => setStep(STEPS[stepIndex - 1]!)}
                          className="rounded-xl border border-subtle px-3 py-2 text-xs font-semibold text-primary"
                        >
                          {t("back")}
                        </button>
                      ) : null}
                      {stepIndex < STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setStep(STEPS[stepIndex + 1]!)}
                          className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white"
                        >
                          {t("next")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={commitDraft}
                          className="inline-flex items-center gap-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t("addLine")}
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {t("linesTitle")}
                  </h2>
                  {lines.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-subtle px-3 py-6 text-center text-sm text-muted">
                      {t("emptyList")}
                    </p>
                  ) : (
                    lines.map((line, index) => (
                      <article
                        key={line.id}
                        className="rounded-xl border border-subtle bg-surface p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 text-start">
                            <p className="truncate text-sm font-semibold text-primary">
                              {index + 1}. {line.medicineName}
                              {line.isChronic ? (
                                <span className="ms-2 text-[10px] text-accent">
                                  {t("chronicBadge")}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {line.doseAmount} {line.form} — {line.frequency} —{" "}
                              {line.duration}
                              {line.notes ? ` — ${line.notes}` : ""}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => void handleToggleFavorite(line)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-subtle text-muted hover:text-accent"
                              aria-label={t("toggleFavorite")}
                            >
                              <Star
                                className={[
                                  "h-3.5 w-3.5",
                                  favoriteNames.has(line.medicineName.toLowerCase())
                                    ? "fill-accent text-accent"
                                    : "",
                                ].join(" ")}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeLine(line.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-subtle text-muted hover:text-accent-danger"
                              aria-label={t("removeDrug")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section
                className={[
                  "min-h-0 items-center justify-center overflow-auto bg-gray-100 p-4 sm:p-8",
                  showPreviewMobile ? "flex" : "hidden lg:flex",
                ].join(" ")}
              >
                {paper}
              </section>
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-subtle bg-surface px-4 py-3 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!lines.length || templatePending}
                  onClick={handleSaveTemplate}
                  className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-elevated px-3 py-2.5 text-sm font-semibold text-primary transition hover:border-accent/40 disabled:opacity-50"
                >
                  <BookmarkPlus className="h-4 w-4" />
                  {t("saveTemplate")}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-xl border border-subtle bg-elevated px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-accent/40"
                >
                  <Printer className="h-4 w-4" />
                  {t("print")}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 rounded-xl border border-accent-success/30 bg-accent-success/15 px-4 py-2.5 text-sm font-semibold text-accent-success transition hover:bg-accent-success/25"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t("whatsapp")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {pending ? t("saving") : t("save")}
                </button>
              </div>
            </footer>
          </motion.div>
        </>
  );

  if (isInline) return shell;

  return createPortal(
    <AnimatePresence>{shell}</AnimatePresence>,
    document.body,
  );
}
