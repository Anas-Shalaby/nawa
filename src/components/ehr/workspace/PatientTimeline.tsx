"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatAppointmentDateLong, formatAppointmentTime } from "@/lib/datetime/cairo";
import type { Locale } from "@/i18n/routing";
import type { PatientVisitRecord } from "@/lib/queries/patientVisits";
import type { PatientPaymentRecord } from "@/lib/queries/patientPayments";
import type { PatientMediaRecord } from "@/lib/media/types";
import type { PrescriptionRecord } from "@/lib/clinical/prescriptionTypes";

// EHR 2.0 Timeline components
import { TimelineFilters } from "./timeline/TimelineFilters";
import { TimelineEventCard } from "./visit/TimelineEventCard";
import { VisitSummaryCard } from "./visit/VisitSummaryCard";
import { MediaEventCard } from "./visit/MediaEventCard";

interface PatientTimelineProps {
  visits: PatientVisitRecord[];
  payments: PatientPaymentRecord[];
  media: PatientMediaRecord[];
  prescriptions: PrescriptionRecord[];
  defaultDoctorName: string;
}

type TimelineItem = {
  id: string;
  at: number;
  kind: "visit" | "prescription" | "payment" | "media" | "followup" | "cancellation" | "no_show" | "investigation" | "appointment";
  title: string;
  detail?: string;
  doctorName?: string | null;
  highlightTag?: string | null;
  searchTags?: string;
  
  // Custom payloads
  visitNotes?: string | null;
  mediaFilePath?: string;
  mediaTag?: string;
  prescribedLines?: Array<{
    medicineName: string;
    doseAmount: string;
    form: string;
    frequency: string;
    duration: string;
  }>;
};

const INITIAL_BATCH = 8;

function formatMoney(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function getEventGroup(dateMs: number, locale: string): string {
  const now = new Date();
  const date = new Date(dateMs);
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - compareDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isAr = locale === "ar";

  if (diffDays <= 0) {
    return isAr ? "اليوم" : "Today";
  } else if (diffDays === 1) {
    return isAr ? "أمس" : "Yesterday";
  } else if (diffDays <= 7) {
    return isAr ? "هذا الأسبوع" : "Last Week";
  } else if (diffDays <= 30) {
    return isAr ? "هذا الشهر" : "Last Month";
  } else {
    return isAr ? "سابقاً" : "Earlier";
  }
}

export function PatientTimeline({
  visits,
  payments,
  media,
  prescriptions,
  defaultDoctorName,
}: PatientTimelineProps) {
  const tw = useTranslations("ehr.workspace");
  const t = useTranslations("ehr");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_BATCH);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Hydrate secure signed URLs for media attachments
  useEffect(() => {
    async function loadUrls() {
      const paths = media.map((m) => m.filePath);
      if (paths.length > 0) {
        try {
          const { createSignedEhrUrls } = await import("@/lib/media/storage");
          const urls = await createSignedEhrUrls(paths);
          setSignedUrls(urls);
        } catch (e) {
          console.error("Failed to load signed URLs", e);
        }
      }
    }
    loadUrls();
  }, [media]);

  // 1. Build unified medical memory timeline
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Keep track of diagnosed chronic diseases & repeated diagnoses for smart highlights
    const diagnosisCounts: Record<string, number> = {};
    for (const v of visits) {
      if (v.status === "completed" && v.doctorNotes) {
        try {
          const parsed = JSON.parse(v.doctorNotes);
          if (parsed && parsed.version === "sprint3" && parsed.assessment?.primaryDiagnosis) {
            const diag = parsed.assessment.primaryDiagnosis.trim().toLowerCase();
            diagnosisCounts[diag] = (diagnosisCounts[diag] || 0) + 1;
          }
        } catch(e) {}
      }
    }

    // Process Visits / Appointments
    for (const visit of visits) {
      const isCompleted = visit.status === "completed";
      const isCanceled = visit.status === "canceled";
      const isNoShow = visit.status === "no_show";

      let kind: TimelineItem["kind"] = "appointment";
      if (isCompleted) kind = "visit";
      else if (isCanceled) kind = "cancellation";
      else if (isNoShow) kind = "no_show";

      // Parse structured diagnosis and check complaint
      let primaryDiag = "";
      let hasFollowUp = false;
      let searchNotesContent = "";

      if (visit.doctorNotes) {
        try {
          const parsed = JSON.parse(visit.doctorNotes);
          if (parsed && parsed.version === "sprint3") {
            primaryDiag = parsed.assessment?.primaryDiagnosis || "";
            hasFollowUp = parsed.treatmentPlan?.instructions?.toLowerCase().includes("follow") || false;
            searchNotesContent = [
              parsed.chiefComplaint,
              parsed.assessment?.primaryDiagnosis,
              parsed.assessment?.secondaryDiagnosis,
              parsed.treatmentPlan?.notes,
              parsed.clinicalExamination
            ].join(" ");
          }
        } catch(e) {
          searchNotesContent = visit.doctorNotes;
        }
      }

      // Smart Highlight flag
      let highlightTag: string | null = null;
      if (isNoShow) {
        highlightTag = isAr ? "تغيب عن الحضور" : "No-Show Alert";
      } else if (primaryDiag && diagnosisCounts[primaryDiag.trim().toLowerCase()] > 1) {
        highlightTag = isAr ? "تشخيص متكرر" : "Repeated Diagnosis";
      }

      // Cross reference prescription created during this visit
      const matchingRx = prescriptions.find(
        (r) => Math.abs(new Date(r.createdAt).getTime() - new Date(visit.appointmentDate).getTime()) < 3600000
      );

      items.push({
        id: `visit-${visit.id}`,
        at: new Date(visit.appointmentDate).getTime(),
        kind,
        title: visit.serviceName || (isAr ? "جلسة كشف طبي" : "Clinical Consultation"),
        doctorName: defaultDoctorName,
        highlightTag,
        searchTags: `${visit.serviceName} ${defaultDoctorName} ${searchNotesContent} ${primaryDiag}`,
        visitNotes: visit.doctorNotes,
        prescribedLines: matchingRx?.lines || undefined,
      });

      // If visit triggered follow-up scheduling
      if (hasFollowUp) {
        items.push({
          id: `followup-${visit.id}`,
          at: new Date(visit.appointmentDate).getTime() + 1000,
          kind: "followup",
          title: isAr ? "متابعة مجدولة" : "Scheduled Follow-up",
          detail: isAr ? `متابعة زيارة ${visit.serviceName}` : `Follow-up on ${visit.serviceName}`,
          doctorName: defaultDoctorName,
          searchTags: `followup ${visit.serviceName} ${defaultDoctorName}`,
        });
      }
    }

    // Process standalone Prescriptions (if not matched to visual visit card directly)
    for (const rx of prescriptions) {
      const medNames = rx.lines.map((l) => l.medicineName).join(" ");
      items.push({
        id: `rx-${rx.id}`,
        at: new Date(rx.createdAt).getTime(),
        kind: "prescription",
        title: isAr ? "روشتة علاجية" : "Prescription",
        detail: rx.lines.map((l) => `${l.medicineName} (${l.doseAmount})`).join(" , "),
        doctorName: rx.doctorName,
        searchTags: `prescription ${medNames} ${rx.doctorName}`,
        prescribedLines: rx.lines,
      });
    }

    // Process Payments
    for (const pay of payments) {
      items.push({
        id: `pay-${pay.id}`,
        at: new Date(pay.paidAt).getTime(),
        kind: "payment",
        title: isAr ? "تحصيل دفعة مالية" : "Payment Recorded",
        detail: `${formatMoney(pay.amountPaid, locale)} ${t("currency")}`,
        searchTags: `payment paid financial invoice ${pay.amountPaid}`,
      });
    }

    // Process Media attachments
    for (const m of media) {
      items.push({
        id: `media-${m.id}`,
        at: new Date(m.createdAt).getTime(),
        kind: "media",
        title: m.tag || (isAr ? "مرفق طبي" : "Attachment"),
        detail: m.notes || undefined,
        mediaFilePath: m.filePath,
        mediaTag: m.tag,
        searchTags: `media image x-ray attachment ${m.tag} ${m.notes}`,
      });
    }

    // Sort descending chronologically
    return items.sort((a, b) => b.at - a.at);
  }, [visits, payments, media, prescriptions, locale, isAr, t, defaultDoctorName]);

  // 2. Apply Search & Category Filters
  const filteredItems = useMemo(() => {
    let result = timelineItems;

    // Filter by Category
    if (selectedFilter !== "all") {
      result = result.filter((item) => {
        if (selectedFilter === "visits") return item.kind === "visit" || item.kind === "appointment";
        if (selectedFilter === "prescriptions") return item.kind === "prescription";
        if (selectedFilter === "images") return item.kind === "media";
        if (selectedFilter === "payments") return item.kind === "payment";
        if (selectedFilter === "followups") return item.kind === "followup";
        if (selectedFilter === "investigations") {
          if (item.kind !== "visit") return false;
          try {
            const parsed = JSON.parse(item.visitNotes || "");
            return !!(parsed && parsed.version === "sprint3" && (parsed.investigations?.lab || parsed.investigations?.imaging));
          } catch(e) {
            return false;
          }
        }
        return true;
      });
    }

    // Filter by Search Query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) => {
        const text = [
          item.title,
          item.detail,
          item.doctorName,
          item.searchTags,
        ].join(" ").toLowerCase();
        return text.includes(query);
      });
    }

    return result;
  }, [timelineItems, selectedFilter, searchQuery]);

  // 3. Group filtered items by date periods (Today, Yesterday, etc.)
  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    const visibleBatch = filteredItems.slice(0, visibleLimit);

    for (const item of visibleBatch) {
      const label = getEventGroup(item.at, locale);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }

    return groups;
  }, [filteredItems, visibleLimit, locale]);

  const hasMore = filteredItems.length > visibleLimit;

  return (
    <section id="workspace-timeline" className="mb-10 text-start">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-primary">{tw("timelineTitle")}</h2>
        <p className="text-xs text-muted mt-1">{tw("timelineHint")}</p>
      </div>

      {/* Filters & Search Box */}
      <TimelineFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        locale={locale}
      />

      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted bg-surface/40 border border-subtle/50 rounded-2xl">
          {isAr ? "لا توجد أحداث مطابقة في السجل الطبي للمريض." : "No matching events found in patient history."}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedTimeline).map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-4">
              {/* Group Date Header */}
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider border-b border-subtle/50 pb-1">
                {groupLabel}
              </h3>

              <div className="relative ps-2">
                {items.map((item) => (
                  <TimelineEventCard
                    key={item.id}
                    kind={item.kind}
                    title={item.title}
                    dateLabel={formatAppointmentDateLong(new Date(item.at).toISOString(), locale)}
                    doctorName={item.doctorName}
                    highlightTag={item.highlightTag}
                    locale={locale}
                  >
                    {/* Render different payload cards based on event kind */}
                    {item.kind === "visit" && (
                      <VisitSummaryCard
                        rawNotes={item.visitNotes}
                        doctorName={item.doctorName || ""}
                        serviceName={item.title}
                        status="completed"
                        dateLabel={formatAppointmentDateLong(new Date(item.at).toISOString(), locale)}
                        locale={locale}
                        prescribedLines={item.prescribedLines}
                      />
                    )}
                    {item.kind === "media" && item.mediaFilePath && signedUrls[item.mediaFilePath] && (
                      <MediaEventCard
                        url={signedUrls[item.mediaFilePath]}
                        tag={item.mediaTag || ""}
                        notes={item.detail}
                        dateLabel={formatAppointmentDateLong(new Date(item.at).toISOString(), locale)}
                        locale={locale}
                      />
                    )}
                    {item.kind !== "visit" && item.kind !== "media" && item.detail && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-elevated/40 border border-subtle/40 rounded-xl p-3">
                        {item.detail}
                      </p>
                    )}
                  </TimelineEventCard>
                ))}
              </div>
            </div>
          ))}

          {/* Lazy Load Button */}
          {hasMore && (
            <div className="text-center pt-2 hide-on-print">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + INITIAL_BATCH)}
                className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent transition hover:bg-accent/10"
              >
                {isAr ? "تحميل المزيد من السجل الطبي" : "Load more clinical history"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
