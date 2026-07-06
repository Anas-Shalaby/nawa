"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type PatientDetailTab = "general" | "record" | "ehr";

interface PatientDetailTabsProps {
  activeTab: PatientDetailTab;
  onTabChange: (tab: PatientDetailTab) => void;
  className?: string;
}

export function PatientDetailTabs({
  activeTab,
  onTabChange,
  className = "",
}: PatientDetailTabsProps) {
  const t = useTranslations("ehr");

  const tabs: { id: PatientDetailTab; label: string }[] = [
    { id: "general", label: t("tabGeneral") },
    { id: "record", label: t("tabVisitRecord") },
    { id: "ehr", label: t("tabVisualEhr") },
  ];

  return (
    <div
      className={[
        "flex gap-1 rounded-xl border border-subtle bg-base/50 p-1",
        className,
      ].join(" ")}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm",
            activeTab === tab.id
              ? "bg-accent/15 text-accent"
              : "text-muted hover:text-primary",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
