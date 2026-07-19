"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ClipboardCopy, Check, Activity, Heart, Clock } from "lucide-react";
import type { PrescriptionRecord, ChronicMedicationRecord } from "@/lib/clinical/prescriptionTypes";

interface MedicationHistoryProps {
  chronicMedications: ChronicMedicationRecord[];
  prescriptions: PrescriptionRecord[];
  locale: string;
}

export function MedicationHistory({
  chronicMedications = [],
  prescriptions = [],
  locale,
}: MedicationHistoryProps) {
  const isAr = locale === "ar";
  const [activeTab, setActiveTab] = useState<"current" | "past" | "frequent">("current");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute Past and Frequently Used Medications
  const computedMeds = useMemo(() => {
    const chronicNames = new Set(chronicMedications.map((m) => m.medicineName.trim().toLowerCase()));
    const pastMap = new Map<string, any>();
    const frequencyMap = new Map<string, { count: number; line: any }>();

    for (const rx of prescriptions) {
      for (const line of rx.lines) {
        const name = line.medicineName.trim();
        const key = name.toLowerCase();

        // Track frequency
        const freq = frequencyMap.get(key) || { count: 0, line };
        freq.count += 1;
        frequencyMap.set(key, freq);

        // Track past (if not in current chronic medications)
        if (!chronicNames.has(key)) {
          pastMap.set(key, line);
        }
      }
    }

    // Top 3 most frequent
    const frequent = Array.from(frequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((f) => f.line);

    const past = Array.from(pastMap.values());

    return {
      past,
      frequent,
    };
  }, [chronicMedications, prescriptions]);

  function handleReuse(medName: string, id: string) {
    navigator.clipboard.writeText(medName);
    setCopiedId(id);
    toast.success(
      isAr
        ? `تم نسخ "${medName}" إلى الحافظة! يمكنك كتابتها أو البحث عنها في الروشتة.`
        : `Copied "${medName}" to clipboard! You can paste or search it in the Prescription Builder.`
    );
    setTimeout(() => setCopiedId(null), 2000);
  }

  const tabs = [
    { id: "current", label: isAr ? "الأدوية المزمنة الحالية" : "Current Medications", icon: Heart },
    { id: "past", label: isAr ? "الأدوية السابقة" : "Past Medications", icon: Clock },
    { id: "frequent", label: isAr ? "الأكثر استخداماً" : "Frequently Used", icon: Activity },
  ];

  const currentList = activeTab === "current"
    ? chronicMedications.map((m) => ({ id: m.id, medicineName: m.medicineName, doseAmount: m.doseAmount || "-", form: m.form || "", frequency: m.frequency || "", duration: m.duration || "" }))
    : activeTab === "past"
      ? computedMeds.past
      : computedMeds.frequent;

  return (
    <div className="bg-surface border border-subtle/80 rounded-2xl p-5 shadow-sm space-y-4 text-start hide-on-print">
      
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
          {isAr ? "سجل الأدوية والعلاجات" : "Medication & Treatment History"}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition -mb-px ${
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-primary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted/70 italic">
          {isAr ? "لا توجد أدوية مسجلة في هذا القسم" : "No medications recorded in this category"}
        </p>
      ) : (
        <ul className="divide-y divide-subtle/40">
          {currentList.map((med, index) => {
            const uniqueId = `${activeTab}-${med.id}-${index}`;
            const direction = [
              med.doseAmount,
              med.form,
              med.frequency,
              med.duration
            ].filter(Boolean).join(" · ");

            return (
              <li key={uniqueId} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-1 last:pb-1">
                <div>
                  <p className="font-bold text-primary">{med.medicineName}</p>
                  {direction && <p className="text-muted mt-0.5">{direction}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleReuse(med.medicineName, uniqueId)}
                  className={`inline-flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 transition text-[10px] font-semibold ${
                    copiedId === uniqueId
                      ? "bg-accent-success/15 border-accent-success/30 text-accent-success"
                      : "bg-surface border-subtle/80 text-muted hover:text-primary hover:border-subtle"
                  }`}
                >
                  {copiedId === uniqueId ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{isAr ? "تم النسخ" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-3.5 w-3.5" />
                      <span>{isAr ? "نسخ للروشتة" : "Reuse"}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

    </div>
  );
}
