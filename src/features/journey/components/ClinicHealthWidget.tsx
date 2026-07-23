"use client";

import { useLocale, useTranslations } from "next-intl";
import { Activity, Users, Calendar, Banknote, Package, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import type { Locale } from "@/i18n/routing";

export function ClinicHealthWidget() {
  const t = useTranslations("journey.health");
  const locale = useLocale() as Locale;
  const isRtl = locale === "ar";

  // Mocked state for Clinic Health for now
  const dimensions = [
    { id: "scheduling", icon: Calendar, status: "healthy", valueKey: "schedulingHealthy" },
    { id: "patients", icon: Users, status: "needs_attention", valueKey: "patientsNeedsAttention" },
    { id: "finance", icon: Banknote, status: "healthy", valueKey: "financeHealthy" },
    { id: "inventory", icon: Package, status: "getting_started", valueKey: "inventoryStarted" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle2 className="h-4 w-4 text-accent" />;
      case "needs_attention": return <AlertTriangle className="h-4 w-4 text-accent-danger" />;
      case "getting_started": return <PlayCircle className="h-4 w-4 text-muted" />;
      default: return null;
    }
  };

  return (
    <div className="mb-6 rounded-3xl border border-subtle bg-surface shadow-sm overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="p-6 border-b border-subtle">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
            <Activity className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x rtl:divide-x-reverse divide-subtle bg-surface/50">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          return (
            <div key={dim.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Icon className="h-5 w-5 text-muted" />
                {t(`dimensions.${dim.id}`)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(dim.status)}
                <span className={dim.status === "needs_attention" ? "text-accent-danger font-medium" : "text-muted"}>
                  {t(`status.${dim.status}`)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
