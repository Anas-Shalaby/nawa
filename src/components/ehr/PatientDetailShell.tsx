"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  FilePlus2,
  Loader2,
  Printer,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { givePatientStrike } from "@/actions/managePatients";
import { saveConsultationNotes } from "@/actions/saveConsultationNotes";
import { usePermission } from "@/components/auth/PermissionProvider";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { PatientMediaRecord } from "@/lib/media/types";
import type { PatientFamily, PatientRecord } from "@/lib/queries/patients";
import type { DashboardService } from "@/lib/dashboard/types";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";
import type { AppointmentStatus } from "@/lib/dashboard/types";
import type {
  ChronicMedicationRecord,
  MedicineFavoriteRecord,
  PrescriptionRecord,
  PrescriptionTemplateRecord,
} from "@/lib/clinical/prescriptionTypes";
import { formatLineInstruction } from "@/lib/clinical/prescriptionFormat";

// Stepper components
import { VisitProgress } from "./workspace/visit/VisitProgress";
import { ChiefComplaintCard } from "./workspace/visit/ChiefComplaintCard";
import { HistoryEditor } from "./workspace/visit/HistoryEditor";
import { ClinicalExam } from "./workspace/visit/ClinicalExam";
import { AssessmentCard } from "./workspace/visit/AssessmentCard";
import { InvestigationPanel } from "./workspace/visit/InvestigationPanel";
import { TreatmentPlanCard } from "./workspace/visit/TreatmentPlanCard";
import { PrescriptionSection } from "./workspace/visit/PrescriptionSection";
import { FollowUpCard } from "./workspace/visit/FollowUpCard";
import { BillingCard } from "./workspace/BillingCard";
import { FinishVisitPanel } from "./workspace/FinishVisitPanel";

// Modals
import { ScheduleSessionModal } from "@/components/dashboard/ScheduleSessionModal";
import { RecordPaymentModal } from "@/components/patients/RecordPaymentModal";
import { PatientFormModal } from "@/components/patients/PatientFormModal";
import { PatientFamilyWidget } from "@/components/patients/PatientFamilyWidget";
import { PatientHeader } from "./workspace/PatientHeader";
import { ClinicalSummary } from "./workspace/ClinicalSummary";
import { MediaGallery } from "./workspace/MediaGallery";
import { PatientTimeline } from "./workspace/PatientTimeline";
import { PinnedSummary } from "./workspace/timeline/PinnedSummary";
import { ClinicalSummaryPanel } from "./workspace/timeline/ClinicalSummaryPanel";
import { PatientSnapshot } from "./workspace/intelligence/PatientSnapshot";
import { VisitInsights } from "./workspace/intelligence/VisitInsights";
import { QuickActionPanel } from "./workspace/intelligence/QuickActionPanel";
import { RelatedHistory } from "./workspace/intelligence/RelatedHistory";
import { MedicationHistory } from "./workspace/intelligence/MedicationHistory";
import { FollowUpCenter } from "./workspace/intelligence/FollowUpCenter";
import { MseCard } from "./workspace/visit/MseCard";

// Visit Data Schemas
interface StructuredVisit {
  version: "sprint3";
  chiefComplaint: string;
  history: {
    presentIllness: string;
    pastMedical: string;
    drug: string;
    family: string;
    social: string;
  };
  clinicalExamination: string;
  vitals: {
    heartRate: string;
    bloodPressure: string;
    temperature: string;
    weight: string;
  };
  assessment: {
    primaryDiagnosis: string;
    secondaryDiagnosis: string;
    notes: string;
  };
  investigations: {
    lab: string;
    imaging: string;
    other: string;
  };
  treatmentPlan: {
    notes: string;
    lifestyle: string;
    procedures: string;
    instructions: string;
  };
  mse?: {
    appearance?: string;
    behavior?: string;
    speech?: string;
    mood?: string;
    affect?: string;
    thoughtProcess?: string;
    thoughtContent?: string;
    perception?: string;
    insight?: string;
    judgment?: string;
    cognition?: string;
  };
}

interface FollowUpData {
  required: boolean;
  interval: "none" | "3d" | "1w" | "2w" | "1m" | "custom";
  customDate: string;
  notes: string;
}

const DEFAULT_VISIT: StructuredVisit = {
  version: "sprint3",
  chiefComplaint: "",
  history: {
    presentIllness: "",
    pastMedical: "",
    drug: "",
    family: "",
    social: "",
  },
  clinicalExamination: "",
  vitals: {
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    weight: "",
  },
  assessment: {
    primaryDiagnosis: "",
    secondaryDiagnosis: "",
    notes: "",
  },
  investigations: {
    lab: "",
    imaging: "",
    other: "",
  },
  treatmentPlan: {
    notes: "",
    lifestyle: "",
    procedures: "",
    instructions: "",
  },
  mse: {
    appearance: "",
    behavior: "",
    speech: "",
    mood: "",
    affect: "",
    thoughtProcess: "",
    thoughtContent: "",
    perception: "",
    insight: "",
    judgment: "",
    cognition: "",
  },
};

function parseVisitNotes(notesString: string | null | undefined): StructuredVisit {
  if (!notesString?.trim()) {
    return { ...DEFAULT_VISIT };
  }
  try {
    const parsed = JSON.parse(notesString);
    if (parsed && parsed.version === "sprint3") {
      return {
        version: "sprint3",
        chiefComplaint: parsed.chiefComplaint || "",
        history: {
          presentIllness: parsed.history?.presentIllness || "",
          pastMedical: parsed.history?.pastMedical || "",
          drug: parsed.history?.drug || "",
          family: parsed.history?.family || "",
          social: parsed.history?.social || "",
        },
        clinicalExamination: parsed.clinicalExamination || "",
        vitals: {
          heartRate: parsed.vitals?.heartRate || "",
          bloodPressure: parsed.vitals?.bloodPressure || "",
          temperature: parsed.vitals?.temperature || "",
          weight: parsed.vitals?.weight || "",
        },
        assessment: {
          primaryDiagnosis: parsed.assessment?.primaryDiagnosis || "",
          secondaryDiagnosis: parsed.assessment?.secondaryDiagnosis || "",
          notes: parsed.assessment?.notes || "",
        },
        investigations: {
          lab: parsed.investigations?.lab || "",
          imaging: parsed.investigations?.imaging || "",
          other: parsed.investigations?.other || "",
        },
        treatmentPlan: {
          notes: parsed.treatmentPlan?.notes || "",
          lifestyle: parsed.treatmentPlan?.lifestyle || "",
          procedures: parsed.treatmentPlan?.procedures || "",
          instructions: parsed.treatmentPlan?.instructions || "",
        },
        mse: {
          appearance: parsed.mse?.appearance || "",
          behavior: parsed.mse?.behavior || "",
          speech: parsed.mse?.speech || "",
          mood: parsed.mse?.mood || "",
          affect: parsed.mse?.affect || "",
          thoughtProcess: parsed.mse?.thoughtProcess || "",
          thoughtContent: parsed.mse?.thoughtContent || "",
          perception: parsed.mse?.perception || "",
          insight: parsed.mse?.insight || "",
          judgment: parsed.mse?.judgment || "",
          cognition: parsed.mse?.cognition || "",
        },
      };
    }
  } catch (e) {
    // Treat as plain text fallback
  }

  return {
    ...DEFAULT_VISIT,
    chiefComplaint: notesString.trim(),
  };
}

interface PatientDetailShellProps {
  patient: PatientRecord;
  tenantId: string;
  initialMedia: PatientMediaRecord[];
  initialVisits?: PatientVisitRecord[];
  initialPayments: PatientPaymentRecord[];
  services: DashboardService[];
  doctorName: string;
  clinicName: string;
  specialty?: string;
  clinicPhone?: string;
  clinicLocation?: string;
  logoUrl?: string | null;
  initialPrescriptions?: PrescriptionRecord[];
  initialFavorites?: MedicineFavoriteRecord[];
  clinicTemplates?: PrescriptionTemplateRecord[];
  chronicMedications?: ChronicMedicationRecord[];
  backHref?: string;
  compact?: boolean;
  family?: PatientFamily;
}

const ACTIVE_TODAY: AppointmentStatus[] = [
  "in_session",
  "checked_in",
  "confirmed",
  "pending",
];

function cairoDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function formatShortDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

function pickCurrentVisit(visits: PatientVisitRecord[]): PatientVisitRecord | null {
  const today = cairoDayKey(new Date().toISOString());
  const todays = visits.filter((v) => cairoDayKey(v.appointmentDate) === today);
  const rank = (status: AppointmentStatus) => {
    const i = ACTIVE_TODAY.indexOf(status);
    return i === -1 ? 99 : i;
  };
  const active = [...todays]
    .filter((v) => ACTIVE_TODAY.includes(v.status) || v.status === "completed")
    .sort((a, b) => rank(a.status) - rank(b.status));
  return active[0] ?? null;
}

export function PatientDetailShell({
  patient,
  tenantId,
  initialMedia,
  initialVisits,
  initialPayments,
  services,
  doctorName,
  clinicName,
  specialty,
  clinicPhone,
  clinicLocation,
  logoUrl,
  initialPrescriptions = [],
  initialFavorites = [],
  clinicTemplates = [],
  chronicMedications = [],
  backHref = "/dashboard/patients",
  compact = false,
  family,
}: PatientDetailShellProps) {
  const t = useTranslations("ehr");
  const tw = useTranslations("ehr.workspace");
  const tv = useTranslations("ehr.workspace.visit");
  const tPatients = useTranslations("patients");
  const locale = useLocale() as Locale;

  const router = useRouter();

  // Permissions
  const canWriteEhr = usePermission("ehr.write");
  const canPrescribe = usePermission("ehr.prescribe");
  const canViewEhr = usePermission("ehr.view");
  const canUpdatePatient = usePermission("patients.update");

  // Shared UI States
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [strikeConfirmOpen, setStrikeConfirmOpen] = useState(false);
  const [noShowCount, setNoShowCount] = useState(patient.noShowCount);
  const [balanceDue, setBalanceDue] = useState(patient.totalBalanceDue);
  const [payments, setPayments] = useState(initialPayments);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [isStrikePending, startStrikeTransition] = useTransition();

  // Stepper Core States
  const [activeStep, setActiveStep] = useState<number>(1);
  const [visitData, setVisitData] = useState<StructuredVisit>(DEFAULT_VISIT);
  const [followupData, setFollowupData] = useState<FollowUpData>({
    required: false,
    interval: "none",
    customDate: "",
    notes: "",
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
  });

  const visits = useMemo(() => initialVisits ?? [], [initialVisits]);
  const currentVisit = useMemo(() => pickCurrentVisit(visits), [visits]);

  // EHR 2.0 Dynamic Medical Memory Parsers
  const parsedSummary = useMemo(() => {
    const allergiesSet = new Set<string>();
    const chronicDiseasesSet = new Set<string>();
    const recentDiagnoses: string[] = [];

    for (const v of visits) {
      if (v.doctorNotes) {
        try {
          const parsed = JSON.parse(v.doctorNotes);
          if (parsed && parsed.version === "sprint3") {
            if (parsed.assessment?.primaryDiagnosis?.trim()) {
              recentDiagnoses.push(parsed.assessment.primaryDiagnosis.trim());
            }
            if (parsed.history?.pastMedical?.trim()) {
              const historyStr = parsed.history.pastMedical.toLowerCase();
              if (historyStr.includes("diabetes") || historyStr.includes("سكر")) {
                chronicDiseasesSet.add(locale === "ar" ? "السكري" : "Diabetes");
              }
              if (historyStr.includes("hypertension") || historyStr.includes("ضغط")) {
                chronicDiseasesSet.add(locale === "ar" ? "ضغط الدم" : "Hypertension");
              }
              if (historyStr.includes("asthma") || historyStr.includes("ربو")) {
                chronicDiseasesSet.add(locale === "ar" ? "الربو" : "Asthma");
              }
            }
            if (parsed.history?.drug?.trim()) {
              const drugStr = parsed.history.drug.toLowerCase();
              if (drugStr.includes("allergy") || drugStr.includes("حساسية")) {
                allergiesSet.add(parsed.history.drug.trim());
              }
            }
          }
        } catch (e) {}
      }
    }

    return {
      allergies: Array.from(allergiesSet),
      chronicDiseases: Array.from(chronicDiseasesSet),
      recentDiagnosis: recentDiagnoses[0] ?? null,
    };
  }, [visits, locale]);

  const upcomingFollowUpLabel = useMemo(() => {
    const future = visits.filter(
      (v) => new Date(v.appointmentDate).getTime() > Date.now() && v.status !== "canceled"
    );
    if (future.length === 0) return null;
    const sorted = [...future].sort(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
    );
    return formatShortDate(sorted[0].appointmentDate, locale);
  }, [visits, locale]);

  const demographics = useMemo(() => {
    const raw = patient.notes || "";
    const isAr = locale === "ar";
    const result = {
      age: isAr ? "غير مسجل" : "Not recorded",
      gender: isAr ? "غير مسجل font-semibold" : "Not recorded",
      bloodGroup: isAr ? "غير مسجل" : "Not recorded"
    };
    
    const ageMatch = raw.match(/(?:age|العمر)\s*[:：]\s*([^\n|;]+)/i);
    if (ageMatch) result.age = ageMatch[1].trim();

    const genderMatch = raw.match(/(?:gender|الجنس)\s*[:：]\s*([^\n|;]+)/i);
    if (genderMatch) result.gender = genderMatch[1].trim();

    const bloodMatch = raw.match(/(?:blood|فصيلة الدم|فصيلة)\s*[:：]\s*([^\n|;]+)/i);
    if (bloodMatch) result.bloodGroup = bloodMatch[1].trim();

    return result;
  }, [patient.notes, locale]);

  useEffect(() => {
    setNoShowCount(patient.noShowCount);
    setBalanceDue(patient.totalBalanceDue);
  }, [patient.id, patient.noShowCount, patient.totalBalanceDue]);

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  useEffect(() => {
    setPrescriptions(initialPrescriptions);
  }, [initialPrescriptions]);

  // Load notes on initialization
  useEffect(() => {
    const rawNotes = currentVisit?.doctorNotes || (currentVisit ? "" : patient.notes);
    const parsed = parseVisitNotes(rawNotes);
    setVisitData(parsed);
    setSaveStatus("saved");
  }, [patient.id, currentVisit, patient.notes]);

  // Guided stepper auto-save debounced trigger
  useEffect(() => {
    const serialized = JSON.stringify(visitData);
    const rawNotes = currentVisit?.doctorNotes || (currentVisit ? "" : patient.notes) || "";
    const targetParsed = parseVisitNotes(rawNotes);

    if (JSON.stringify(targetParsed) === serialized) {
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const result = await saveConsultationNotes({
          patientId: patient.id,
          notes: serialized,
          appointmentId: currentVisit?.id ?? null,
        });
        if (result.success) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [visitData, patient.id, currentVisit, patient.notes]);

  const lastVisit =
    visits.find((v) => v.status === "completed" || v.status === "in_session")
      ?.appointmentDate ??
    visits[0]?.appointmentDate ??
    null;

  const lastDiagnosis = useMemo(() => {
    const completed = visits.find(
      (v) => v.status === "completed" && v.doctorNotes?.trim(),
    );
    if (!completed?.doctorNotes) return null;
    const parsed = parseVisitNotes(completed.doctorNotes);
    return parsed.assessment.primaryDiagnosis || parsed.chiefComplaint || null;
  }, [visits]);

  const recentVisitsCount = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return visits.filter(
      (v) => v.status === "completed" && new Date(v.appointmentDate).getTime() >= ninetyDaysAgo
    ).length;
  }, [visits]);

  function handleConfirmStrike() {
    if (isStrikePending || patient.isArchived) return;
    const previousCount = noShowCount;
    setStrikeConfirmOpen(false);
    setNoShowCount((current) => current + 1);

    startStrikeTransition(async () => {
      const result = await givePatientStrike(patient.id);
      if (!result.success) {
        setNoShowCount(previousCount);
        toast.error(tPatients("strikeError"), { description: result.error });
        return;
      }
      const count = result.newNoShowCount ?? previousCount + 1;
      setNoShowCount(count);
      toast.success(tPatients("strikeSuccess"), {
        description: tPatients("strikeSuccessHint", {
          name: patient.name,
          count,
        }),
      });
    });
  }

  function handleStepFocus(stepId: number) {
    setActiveStep(stepId);
    setExpandedSections((prev) => ({
      ...prev,
      [stepId]: true,
    }));
  }

  function toggleSectionCollapse(stepId: number) {
    setExpandedSections((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  }

  function smoothScrollToId(elementId: string) {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function printStructuredPrescription(rx: PrescriptionRecord) {
    const dateLabel = formatShortDate(rx.createdAt, locale);
    const body = rx.lines
      .map(
        (line, index) =>
          `<div style="margin-bottom:12px"><strong>${index + 1}. ${line.medicineName}</strong><br/><span style="color:#555">${formatLineInstruction(line)}</span></div>`,
      )
      .join("");
    const html = `<!doctype html><html dir="rtl" lang="${locale}"><head><meta charset="utf-8"/><title>${t("prescriptionPrintTitle")}</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#111;background:#fff}
        h1{font-size:18px;margin:0 0 4px}
        .meta{color:#666;font-size:13px;margin-bottom:20px}
      </style></head><body>
      <h1>${rx.clinicName || clinicName}</h1>
      <p class="meta">${rx.doctorName || doctorName} · ${patient.name} · ${dateLabel}</p>
      ${body}
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  function handlePrintFile() {
    window.print();
  }

  const isPsychiatry = specialty?.toLowerCase().includes("psych") ?? false;
  const isAr = locale === "ar";

  function getStepId(key: string): number {
    if (!isPsychiatry) {
      if (key === "cc") return 1;
      if (key === "history") return 2;
      if (key === "exam") return 3;
      if (key === "assessment") return 4;
      if (key === "investigations") return 5;
      if (key === "plan") return 6;
      if (key === "prescription") return 7;
      if (key === "followup") return 8;
      if (key === "billing") return 9;
      if (key === "finish") return 10;
      return 0;
    }
    // Psychiatry mapping
    if (key === "cc") return 1;
    if (key === "history") return 2;
    if (key === "mse") return 3;
    if (key === "assessment") return 4;
    if (key === "plan") return 5;
    if (key === "prescription") return 6;
    if (key === "followup") return 7;
    if (key === "billing") return 8;
    if (key === "finish") return 9;
    return 0;
  }

  // Visual completeness markers for steps
  const steps = isPsychiatry
    ? [
        {
          id: 1,
          key: "cc",
          elementId: "visit-cc",
          isCompleted: !!visitData.chiefComplaint.trim(),
          label: isAr ? "ملاحظات الجلسة" : "Session Notes & Complaint",
          description: isAr ? "شكوى المريض وملاحظات الجلسة" : "Client symptom notes & complaints",
        },
        {
          id: 2,
          key: "history",
          elementId: "visit-history",
          isCompleted:
            !!visitData.history.presentIllness.trim() ||
            !!visitData.history.pastMedical.trim() ||
            !!visitData.history.social.trim(),
          label: isAr ? "التاريخ النفسي والطبي" : "Psychiatric History",
          description: isAr ? "الأمراض والتاريخ العائلي والاجتماعي" : "Family history & lifestyle contexts",
        },
        {
          id: 3,
          key: "mse",
          elementId: "visit-exam",
          isCompleted:
            !!visitData.mse?.appearance?.trim() ||
            !!visitData.mse?.behavior?.trim() ||
            !!visitData.mse?.speech?.trim() ||
            !!visitData.mse?.mood?.trim(),
          label: isAr ? "الفحص العقلي والنفسي (MSE)" : "Mental Status Exam (MSE)",
          description: isAr ? "المظهر، الوجدان، الأفكار والسلوك" : "Appearance, affect, speech & thoughts",
        },
        {
          id: 4,
          key: "assessment",
          elementId: "visit-assessment",
          isCompleted:
            !!visitData.assessment.primaryDiagnosis.trim() ||
            !!visitData.assessment.notes.trim(),
          label: isAr ? "التقييم والتشخيص" : "Psychiatric Assessment",
          description: isAr ? "التشخيص الأساسي والملاحظات" : "Clinical diagnosis & assessment notes",
        },
        {
          id: 5,
          key: "plan",
          elementId: "visit-plan",
          isCompleted:
            !!visitData.treatmentPlan.notes.trim() ||
            !!visitData.treatmentPlan.lifestyle.trim() ||
            !!visitData.treatmentPlan.instructions.trim(),
          label: isAr ? "خطة العلاج والجلسات" : "Treatment & Therapy Plan",
          description: isAr ? "ملاحظات العلاج والواجبات المنزلية" : "Psychotherapy homework & goals",
        },
        {
          id: 6,
          key: "prescription",
          elementId: "visit-prescription",
          isCompleted: prescriptions.length > 0,
          label: isAr ? "الروشتة والعلاجات" : "Medications (Rx)",
          description: isAr ? "وصف الأدوية والجرعات" : "Prescribe drugs & dosages",
        },
        {
          id: 7,
          key: "followup",
          elementId: "visit-followup",
          isCompleted: followupData.required,
          label: isAr ? "الجلسة القادمة" : "Next Session",
          description: isAr ? "جدولة موعد الاستشارة التالي" : "Schedule next counseling slot",
        },
        {
          id: 8,
          key: "billing",
          elementId: "visit-billing",
          isCompleted: balanceDue === 0,
          label: isAr ? "حساب الجلسة" : "Session Billing",
          description: isAr ? "تحصيل رسوم المعاملة الحالية" : "Process invoice balance due",
        },
        {
          id: 9,
          key: "finish",
          elementId: "visit-finish",
          isCompleted: currentVisit?.status === "completed",
          label: isAr ? "إنهاء الجلسة" : "Finish Session",
          description: isAr ? "إغلاق الجلسة الحالية وتوثيقها" : "Close active session file",
        },
      ]
    : [
        {
          id: 1,
          key: "cc",
          elementId: "visit-cc",
          isCompleted: !!visitData.chiefComplaint.trim(),
        },
        {
          id: 2,
          key: "history",
          elementId: "visit-history",
          isCompleted:
            !!visitData.history.presentIllness.trim() ||
            !!visitData.history.pastMedical.trim() ||
            !!visitData.history.drug.trim() ||
            !!visitData.history.family.trim() ||
            !!visitData.history.social.trim(),
        },
        {
          id: 3,
          key: "exam",
          elementId: "visit-exam",
          isCompleted:
            !!visitData.clinicalExamination.trim() ||
            !!visitData.vitals.heartRate ||
            !!visitData.vitals.bloodPressure,
        },
        {
          id: 4,
          key: "assessment",
          elementId: "visit-assessment",
          isCompleted:
            !!visitData.assessment.primaryDiagnosis.trim() ||
            !!visitData.assessment.notes.trim(),
        },
        {
          id: 5,
          key: "investigations",
          elementId: "visit-investigations",
          isCompleted:
            !!visitData.investigations.lab.trim() ||
            !!visitData.investigations.imaging.trim() ||
            !!visitData.investigations.other.trim(),
        },
        {
          id: 6,
          key: "plan",
          elementId: "visit-plan",
          isCompleted:
            !!visitData.treatmentPlan.notes.trim() ||
            !!visitData.treatmentPlan.lifestyle.trim() ||
            !!visitData.treatmentPlan.instructions.trim(),
        },
        {
          id: 7,
          key: "prescription",
          elementId: "visit-prescription",
          isCompleted: prescriptions.length > 0,
        },
        {
          id: 8,
          key: "followup",
          elementId: "visit-followup",
          isCompleted: followupData.required,
        },
        {
          id: 9,
          key: "billing",
          elementId: "visit-billing",
          isCompleted: balanceDue === 0,
        },
        {
          id: 10,
          key: "finish",
          elementId: "visit-finish",
          isCompleted: currentVisit?.status === "completed",
        },
      ];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        dir="rtl"
        className="mx-auto w-full max-w-5xl pb-16 patient-workspace-print"
      >
        {/* 1. Sticky Header */}
        <PatientHeader
          patient={patient}
          currentVisit={currentVisit}
          lastVisitDate={lastVisit}
          balanceDue={balanceDue}
          noShowCount={noShowCount}
          chronicDiseaseCount={0}
          allergyCount={0}
          backHref={backHref}
          compact={compact}
          onEditPatient={() => setEditPatientOpen(true)}
          onPrintFile={handlePrintFile}
        />

        {/* Status Indicator */}
        <div className="mb-4 flex justify-end hide-on-print">
          <div className="flex items-center gap-2 bg-elevated/40 border border-subtle/40 rounded-xl px-3 py-1.5 text-xs text-muted">
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-accent" />
                <span>{tv("saving")}</span>
              </>
            ) : saveStatus === "error" ? (
              <span className="text-accent-danger">Failed to save draft</span>
            ) : (
              <span>{tv("saved")}</span>
            )}
          </div>
        </div>

        {/* EHR 2.0 Patient Snapshot Dashboard */}
        <PatientSnapshot
          patient={{
            id: patient.id,
            name: patient.name,
            phoneNumber: patient.phoneNumber,
            gender: demographics.gender,
            age: demographics.age,
          }}
          bloodGroup={demographics.bloodGroup}
          primaryDoctor={doctorName}
          balanceDue={balanceDue}
          upcomingAppointment={upcomingFollowUpLabel}
          lastVisitDate={lastVisit ? formatShortDate(lastVisit, locale) : null}
          allergies={parsedSummary.allergies}
          chronicDiseases={parsedSummary.chronicDiseases}
          currentMedications={chronicMedications.map(m => m.medicineName)}
          lastDiagnosis={parsedSummary.recentDiagnosis}
          totalVisits={visits.length}
          recentVisitsCount={recentVisitsCount}
          noShowCount={noShowCount}
          locale={locale}
        />

        {/* Quick actions panel */}
        <div className="mt-6">
          <QuickActionPanel
            phoneNumber={patient.phoneNumber}
            onSchedule={() => setScheduleOpen(true)}
            onPayment={() => setPaymentOpen(true)}
            onScrollToTimeline={() => smoothScrollToId("workspace-timeline")}
            onEditPatient={() => setEditPatientOpen(true)}
            onPrintFile={handlePrintFile}
            locale={locale}
          />
        </div>

        {/* Visit Insights alerts */}
        {canViewEhr ? (
          <div className="mt-6">
            <VisitInsights
              balanceDue={balanceDue}
              noShowCount={noShowCount}
              lastVisitDate={lastVisit ? formatShortDate(lastVisit, locale) : null}
              visits={visits}
              allergies={parsedSummary.allergies}
              chronicDiseases={parsedSummary.chronicDiseases}
              locale={locale}
            />
          </div>
        ) : null}

        {/* Spacer before forms */}
        <div className="my-8 border-t border-subtle/50" />

        {/* Guided Stepper Stepper Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main vertical clinical forms */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Step 1: Chief Complaint */}
            {canWriteEhr ? (
              <ChiefComplaintCard
                value={visitData.chiefComplaint}
                onChange={(val) => setVisitData((prev) => ({ ...prev, chiefComplaint: val }))}
                isCollapsed={!expandedSections[getStepId("cc")] && activeStep !== getStepId("cc")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("cc"))}
                isActive={activeStep === getStepId("cc")}
                onFocus={() => handleStepFocus(getStepId("cc"))}
                specialty={specialty}
                locale={locale}
              />
            ) : null}

            {/* Step 2: History */}
            {canWriteEhr ? (
              <HistoryEditor
                value={visitData.history}
                onChange={(val) => setVisitData((prev) => ({ ...prev, history: val }))}
                isCollapsed={!expandedSections[getStepId("history")] && activeStep !== getStepId("history")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("history"))}
                isActive={activeStep === getStepId("history")}
                onFocus={() => handleStepFocus(getStepId("history"))}
              />
            ) : null}

            {/* Step 3: Clinical Examination / MSE */}
            {canWriteEhr ? (
              isPsychiatry ? (
                <MseCard
                  data={visitData.mse || {}}
                  onChange={(val) => setVisitData((prev) => ({ ...prev, mse: val }))}
                  locale={locale}
                  isCollapsed={!expandedSections[getStepId("mse")] && activeStep !== getStepId("mse")}
                  onToggleCollapse={() => toggleSectionCollapse(getStepId("mse"))}
                  isActive={activeStep === getStepId("mse")}
                  onFocus={() => handleStepFocus(getStepId("mse"))}
                />
              ) : (
                <ClinicalExam
                  notes={visitData.clinicalExamination}
                  onNotesChange={(val) => setVisitData((prev) => ({ ...prev, clinicalExamination: val }))}
                  vitals={visitData.vitals}
                  onVitalsChange={(val) => setVisitData((prev) => ({ ...prev, vitals: val }))}
                  isCollapsed={!expandedSections[getStepId("exam")] && activeStep !== getStepId("exam")}
                  onToggleCollapse={() => toggleSectionCollapse(getStepId("exam"))}
                  isActive={activeStep === getStepId("exam")}
                  onFocus={() => handleStepFocus(getStepId("exam"))}
                />
              )
            ) : null}

            {/* Step 4: Assessment & Diagnosis */}
            {canWriteEhr ? (
              <AssessmentCard
                value={visitData.assessment}
                onChange={(val) => setVisitData((prev) => ({ ...prev, assessment: val }))}
                isCollapsed={!expandedSections[getStepId("assessment")] && activeStep !== getStepId("assessment")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("assessment"))}
                isActive={activeStep === getStepId("assessment")}
                onFocus={() => handleStepFocus(getStepId("assessment"))}
              />
            ) : null}

            {/* Step 5: Investigations (Standard Clinic Only) */}
            {canWriteEhr && !isPsychiatry ? (
              <InvestigationPanel
                value={visitData.investigations}
                onChange={(val) => setVisitData((prev) => ({ ...prev, investigations: val }))}
                isCollapsed={!expandedSections[getStepId("investigations")] && activeStep !== getStepId("investigations")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("investigations"))}
                isActive={activeStep === getStepId("investigations")}
                onFocus={() => handleStepFocus(getStepId("investigations"))}
              />
            ) : null}

            {/* Step 6: Treatment Plan */}
            {canWriteEhr ? (
              <TreatmentPlanCard
                value={visitData.treatmentPlan}
                onChange={(val) => setVisitData((prev) => ({ ...prev, treatmentPlan: val }))}
                isCollapsed={!expandedSections[getStepId("plan")] && activeStep !== getStepId("plan")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("plan"))}
                isActive={activeStep === getStepId("plan")}
                onFocus={() => handleStepFocus(getStepId("plan"))}
                specialty={specialty}
                locale={locale}
              />
            ) : null}

            {/* Step 7: Prescription */}
            {canPrescribe ? (
              <PrescriptionSection
                patientId={patient.id}
                patientName={patient.name}
                patientPhone={patient.phoneNumber}
                doctorName={doctorName}
                clinicName={clinicName}
                specialty={specialty}
                clinicPhone={clinicPhone}
                clinicLocation={clinicLocation}
                logoUrl={logoUrl}
                prescriptions={prescriptions}
                favorites={initialFavorites}
                clinicTemplates={clinicTemplates}
                chronicMedications={chronicMedications}
                onPrescriptionSaved={(payload) => {
                  if (!payload.prescriptionId || !payload.publicToken) return;
                  setPrescriptions((current) => [
                    {
                      id: payload.prescriptionId!,
                      patientId: patient.id,
                      doctorName,
                      clinicName,
                      specialty: specialty ?? "",
                      status: "active",
                      generalNotes: null,
                      publicToken: payload.publicToken!,
                      duplicatedFromId: null,
                      createdAt: new Date().toISOString(),
                      lines: payload.lines.map((line: any, index: number) => ({
                        ...line,
                        id: `${payload.prescriptionId}-${index}`,
                        sortOrder: index,
                      })),
                    },
                    ...current,
                  ]);
                }}
                isCollapsed={!expandedSections[getStepId("prescription")] && activeStep !== getStepId("prescription")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("prescription"))}
                isActive={activeStep === getStepId("prescription")}
                onFocus={() => handleStepFocus(getStepId("prescription"))}
              />
            ) : null}

            {/* Step 8: Follow-up */}
            {canWriteEhr ? (
              <FollowUpCard
                value={followupData}
                onChange={(val) => setFollowupData(val)}
                isCollapsed={!expandedSections[getStepId("followup")] && activeStep !== getStepId("followup")}
                onToggleCollapse={() => toggleSectionCollapse(getStepId("followup"))}
                isActive={activeStep === getStepId("followup")}
                onFocus={() => handleStepFocus(getStepId("followup"))}
                onTriggerModal={() => setScheduleOpen(true)}
              />
            ) : null}

            {/* Step 9: Billing */}
            <BillingCard
              balanceDue={balanceDue}
              payments={payments}
              onOpenPayment={() => setPaymentOpen(true)}
              isCollapsed={!expandedSections[getStepId("billing")] && activeStep !== getStepId("billing")}
              onToggleCollapse={() => toggleSectionCollapse(getStepId("billing"))}
              isActive={activeStep === getStepId("billing")}
              onFocus={() => handleStepFocus(getStepId("billing"))}
            />

            {/* Step 10: Finish Visit */}
            {canWriteEhr ? (
              <div id="visit-finish">
                <FinishVisitPanel
                  patientId={patient.id}
                  patientName={patient.name}
                  currentVisit={currentVisit}
                  consultationNotes={JSON.stringify(visitData)}
                  notesDirty={saveStatus === "saving"}
                  latestPrescription={prescriptions[0] ?? null}
                  clinicName={clinicName}
                  doctorName={doctorName}
                  onVisitCompleted={() => {
                    router.refresh();
                  }}
                  onNotesSaved={() => setSaveStatus("saved")}
                  onPrintPrescription={printStructuredPrescription}
                  onOpenFollowUp={() => setScheduleOpen(true)}
                  onOpenPayment={() => setPaymentOpen(true)}
                  specialty={specialty}
                  locale={locale}
                />
              </div>
            ) : null}

          </div>

          {/* Sidebar stepper tracker */}
          <div className="hidden lg:block lg:col-span-1">
            <VisitProgress
              activeStep={activeStep}
              steps={steps}
              onStepClick={(elementId) => {
                const targetStep = steps.find((s) => s.elementId === elementId);
                if (targetStep) {
                  handleStepFocus(targetStep.id);
                  smoothScrollToId(elementId);
                }
              }}
            />
          </div>

        </div>

        {/* Timeline & Media Gallery outside stepper flow */}
        <div className="mt-12 space-y-12">
          {canViewEhr ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Timeline content (left side) */}
              <div className="lg:col-span-3 space-y-8">
                <MediaGallery
                  patientId={patient.id}
                  patientName={patient.name}
                  tenantId={tenantId}
                  initialMedia={initialMedia}
                />

                {/* EHR 2.0 Related History Summary Cards */}
                <RelatedHistory
                  visits={visits}
                  prescriptions={prescriptions}
                  payments={payments}
                  locale={locale}
                />

                {/* EHR 2.0 Follow Up Center Tracker */}
                <FollowUpCenter
                  visits={visits}
                  locale={locale}
                  onScrollToTimeline={() => smoothScrollToId("workspace-timeline")}
                />

                {/* EHR 2.0 Medication History tabs */}
                <MedicationHistory
                  chronicMedications={chronicMedications}
                  prescriptions={prescriptions}
                  locale={locale}
                />
                
                <PatientTimeline
                  visits={visits}
                  payments={payments}
                  media={initialMedia}
                  prescriptions={prescriptions}
                  defaultDoctorName={doctorName}
                />
              </div>

              {/* Sticky facts panel (right side) */}
              <div className="hidden lg:block lg:col-span-1">
                <ClinicalSummaryPanel
                  currentMedications={chronicMedications.map(m => m.medicineName)}
                  allergies={parsedSummary.allergies}
                  chronicDiseases={parsedSummary.chronicDiseases}
                  balanceDue={balanceDue}
                  nextAppointment={upcomingFollowUpLabel}
                  primaryDoctor={doctorName}
                  locale={locale}
                />
              </div>

            </div>
          ) : null}

          {!compact && family ? (
            <PatientFamilyWidget
              patientId={patient.id}
              parent={family.parent}
              dependents={family.dependents}
            />
          ) : null}

          {!compact && !patient.isArchived && canUpdatePatient ? (
            <div className="border-t border-subtle/60 pt-6">
              <button
                type="button"
                disabled={isStrikePending}
                onClick={() => setStrikeConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent-danger disabled:opacity-50"
              >
                {isStrikePending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <UserX className="h-3.5 w-3.5" aria-hidden />
                )}
                {tPatients("giveStrike")}
              </button>
            </div>
          ) : null}
        </div>

      </motion.section>

      {/* Modals */}
      <ScheduleSessionModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        patientId={patient.id}
        tenantId={tenantId}
        patientName={patient.name}
        services={services}
      />

      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        patientId={patient.id}
        balanceDue={balanceDue}
        onRecorded={(newBalance) => {
          const paid = Math.max(0, balanceDue - newBalance);
          setBalanceDue(newBalance);
          setPayments((current) => [
            {
              id: `local-${Date.now()}`,
              amountPaid: paid,
              paidAt: new Date().toISOString(),
            },
            ...current,
          ]);
          toast.success(t("paymentRecorded"));
        }}
      />

      <PatientFormModal
        open={editPatientOpen}
        title={tPatients("editPatient") || "تعديل المريض"}
        patient={patient}
        onClose={() => setEditPatientOpen(false)}
        onSaved={(values) => {
          setEditPatientOpen(false);
          router.refresh();
          toast.success(locale === "ar" ? "تم تحديث بيانات المريض بنجاح" : "Patient details updated successfully");
        }}
      />

      {strikeConfirmOpen ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl border border-subtle bg-surface p-5 text-start shadow-xl"
          >
            <h3 className="text-base font-semibold text-primary">
              {tPatients("strikeConfirmTitle")}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {tPatients("strikeConfirmBody", { name: patient.name })}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStrikeConfirmOpen(false)}
                className="rounded-xl px-3 py-2 text-xs font-medium text-muted hover:text-primary"
              >
                {tPatients("strikeCancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmStrike}
                className="rounded-xl bg-accent-danger px-3 py-2 text-xs font-semibold text-white"
              >
                {tPatients("strikeConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Hidden Printable Clinical Record Summary */}
      <div className="hidden print:block invoice-print-root text-slate-900 bg-white p-6 text-start" dir="rtl">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{clinicName}</h1>
            <p className="text-xs text-slate-600">{doctorName} {specialty ? `· ${specialty}` : ""}</p>
          </div>
          <div className="text-xs text-slate-500">
            {locale === "ar" ? "تاريخ الطباعة" : "Print Date"}: {formatShortDate(new Date().toISOString(), locale)}
          </div>
        </div>

        {/* Patient Info */}
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          {locale === "ar" ? "بيانات المريض الأساسية" : "Patient Information"}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>{locale === "ar" ? "الاسم" : "Name"}: <span className="font-bold">{patient.name}</span></div>
          <div>{locale === "ar" ? "رقم الهاتف" : "Phone"}: <span className="font-bold" dir="ltr">{patient.phoneNumber}</span></div>
          <div>{locale === "ar" ? "رقم الملف" : "Patient ID"}: <span className="font-bold">#P-{patient.id.slice(-4).toUpperCase()}</span></div>
          <div>{locale === "ar" ? "إجمالي الزيارات" : "Total Visits"}: <span className="font-bold">{visits.length}</span></div>
        </div>

        {/* Clinical Summary */}
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          {locale === "ar" ? "الملخص الطبي العام" : "Medical Summary"}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
          <div>{locale === "ar" ? "فصيلة الدم" : "Blood Type"}: <span className="font-bold">{locale === "ar" ? "غير مسجل" : "Not recorded"}</span></div>
          <div>{locale === "ar" ? "الحساسية" : "Allergies"}: <span className="font-bold">{locale === "ar" ? "لا يوجد" : "None"}</span></div>
          <div>{locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}: <span className="font-bold">{locale === "ar" ? "لا يوجد" : "None"}</span></div>
          <div>{locale === "ar" ? "الرصيد المستحق" : "Outstanding Balance"}: <span className="font-bold">{balanceDue} {t("currency")}</span></div>
        </div>

        {/* Current Consultation Details */}
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
          {locale === "ar" ? "ملاحظات الكشف الحالية" : "Current Consultation Notes"}
        </h2>
        <div className="border border-slate-300 rounded-lg p-4 mb-6 text-xs space-y-3">
          {visitData.chiefComplaint.trim() && (
            <div>
              <strong>{locale === "ar" ? "الشكوى الرئيسية" : "Chief Complaint"}:</strong>
              <div className="mt-1 text-slate-700 whitespace-pre-wrap">{visitData.chiefComplaint}</div>
            </div>
          )}
          
          {(visitData.history.presentIllness.trim() || visitData.history.pastMedical.trim()) && (
            <div>
              <strong className="block border-t border-slate-100 pt-2 mt-2">{locale === "ar" ? "التاريخ المرضي" : "History"}:</strong>
              {visitData.history.presentIllness.trim() && <div className="mt-1 text-slate-700">· {locale === "ar" ? "تاريخ المرض الحالي" : "Present Illness"}: {visitData.history.presentIllness}</div>}
              {visitData.history.pastMedical.trim() && <div className="mt-1 text-slate-700">· {locale === "ar" ? "التاريخ السابق" : "Past Medical"}: {visitData.history.pastMedical}</div>}
              {visitData.history.drug.trim() && <div className="mt-1 text-slate-700">· {locale === "ar" ? "التاريخ الدوائي" : "Drug History"}: {visitData.history.drug}</div>}
            </div>
          )}

          {(visitData.clinicalExamination.trim() || visitData.vitals.heartRate || visitData.vitals.bloodPressure) && (
            <div>
              <strong className="block border-t border-slate-100 pt-2 mt-2">{locale === "ar" ? "الفحص والعلامات الحيوية" : "Examination & Vitals"}:</strong>
              {(visitData.vitals.heartRate || visitData.vitals.bloodPressure) && (
                <div className="mt-1 text-slate-700">
                  · HR: {visitData.vitals.heartRate || "-"} bpm | BP: {visitData.vitals.bloodPressure || "-"} mmHg | Temp: {visitData.vitals.temperature || "-"} °C | Wt: {visitData.vitals.weight || "-"} kg
                </div>
              )}
              {visitData.clinicalExamination.trim() && (
                <div className="mt-1 text-slate-700 whitespace-pre-wrap">{visitData.clinicalExamination}</div>
              )}
            </div>
          )}

          {(visitData.assessment.primaryDiagnosis.trim() || visitData.assessment.secondaryDiagnosis.trim()) && (
            <div>
              <strong className="block border-t border-slate-100 pt-2 mt-2">{locale === "ar" ? "التقييم والتشخيص" : "Assessment & Diagnosis"}:</strong>
              {visitData.assessment.primaryDiagnosis.trim() && <div className="mt-1 text-slate-700">· {locale === "ar" ? "التشخيص الأساسي" : "Primary"}: {visitData.assessment.primaryDiagnosis}</div>}
              {visitData.assessment.secondaryDiagnosis.trim() && <div className="mt-1 text-slate-700">· {locale === "ar" ? "التشخيص الفرعي" : "Secondary"}: {visitData.assessment.secondaryDiagnosis}</div>}
              {visitData.assessment.notes.trim() && <div className="mt-1 text-slate-700">{visitData.assessment.notes}</div>}
            </div>
          )}

          {(visitData.investigations.lab.trim() || visitData.investigations.imaging.trim() || visitData.investigations.other.trim()) && (
            <div>
              <strong className="block border-t border-slate-100 pt-2 mt-2">{locale === "ar" ? "الفحوصات المطلوبة" : "Requested Investigations"}:</strong>
              {visitData.investigations.lab.trim() && <div className="mt-1 text-slate-700">· Lab: {visitData.investigations.lab}</div>}
              {visitData.investigations.imaging.trim() && <div className="mt-1 text-slate-700">· Imaging: {visitData.investigations.imaging}</div>}
              {visitData.investigations.other.trim() && <div className="mt-1 text-slate-700">· Other: {visitData.investigations.other}</div>}
            </div>
          )}

          {(visitData.treatmentPlan.notes.trim() || visitData.treatmentPlan.lifestyle.trim() || visitData.treatmentPlan.instructions.trim()) && (
            <div>
              <strong className="block border-t border-slate-100 pt-2 mt-2">{locale === "ar" ? "خطة العلاج" : "Treatment Plan"}:</strong>
              {visitData.treatmentPlan.notes.trim() && <div className="mt-1 text-slate-700">{visitData.treatmentPlan.notes}</div>}
              {visitData.treatmentPlan.lifestyle.trim() && <div className="mt-1 text-slate-700">· Lifestyle: {visitData.treatmentPlan.lifestyle}</div>}
              {visitData.treatmentPlan.instructions.trim() && <div className="mt-1 text-slate-700">· Instructions: {visitData.treatmentPlan.instructions}</div>}
            </div>
          )}
        </div>

        {/* Prescription */}
        {prescriptions.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
              {locale === "ar" ? "الروشتة الطبية الحالية" : "Current Prescription"}
            </h2>
            <table className="w-full border-collapse mb-6 text-xs text-start">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 text-start" style={{ width: "5%" }}>#</th>
                  <th className="p-2 text-start">{locale === "ar" ? "الدواء" : "Medicine"}</th>
                  <th className="p-2 text-start">{locale === "ar" ? "الجرعة" : "Dose"}</th>
                  <th className="p-2 text-start">{locale === "ar" ? "التكرار" : "Frequency"}</th>
                  <th className="p-2 text-start">{locale === "ar" ? "المدة" : "Duration"}</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions[0].lines.map((line: any, index: number) => (
                  <tr key={index} className="border-b border-slate-200">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-bold">{line.medicineName}</td>
                    <td className="p-2">{line.doseAmount} {line.form}</td>
                    <td className="p-2">{line.frequency}</td>
                    <td className="p-2">{line.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Visits History */}
        {visits.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-300 pb-1 mb-3">
              {locale === "ar" ? "سجل الزيارات (آخر 10 زيارات)" : "Visits History (Last 10)"}
            </h2>
            <table className="w-full border-collapse mb-6 text-xs text-start">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-2 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="p-2 text-start">{locale === "ar" ? "الخدمة" : "Service"}</th>
                  <th className="p-2 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 10).map((v: PatientVisitRecord, index: number) => (
                  <tr key={index} className="border-b border-slate-200">
                    <td className="p-2">{formatShortDate(v.appointmentDate, locale)}</td>
                    <td className="p-2">{v.serviceName}</td>
                    <td className="p-2">
                      {locale === "ar"
                        ? v.status === "completed"
                          ? "مكتمل"
                          : v.status === "canceled"
                            ? "ملغي"
                            : "مؤكد"
                        : v.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400">
          {locale === "ar"
            ? `تم توليد هذا الملف بواسطة نظام ${clinicName}`
            : `Generated by ${clinicName} Clinic System`}
        </div>
      </div>
    </>
  );
}
