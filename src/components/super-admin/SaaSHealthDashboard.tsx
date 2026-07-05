import type { SaaSHealthMetrics } from "@/lib/super-admin/metrics";
import { ClinicsOnboardedChart } from "./ClinicsOnboardedChart";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);
}

interface SaaSHealthDashboardProps {
  metrics: SaaSHealthMetrics;
}

export function SaaSHealthDashboard({ metrics }: SaaSHealthDashboardProps) {
  const cards = [
    {
      key: "total",
      label: "إجمالي العيادات",
      value: formatNumber(metrics.totalClinics),
      hint: "كل السجلات في tenants",
      accent: "text-cyan-400",
    },
    {
      key: "active",
      label: "العيادات النشطة",
      value: formatNumber(metrics.activeClinics),
      hint: "موعد واحد على الأقل خلال 7 أيام",
      accent: "text-emerald-400",
    },
    {
      key: "mrr",
      label: "MRR (إيراد شهري متكرر)",
      value: `${formatNumber(metrics.mrrEgp)} ج.م`,
      hint: `${formatNumber(metrics.subscriptionPriceEgp)} ج.م × عيادات نشطة`,
      accent: "text-amber-400",
    },
    {
      key: "processed",
      label: "إجمالي المواعيد المُعالجة",
      value: formatNumber(metrics.totalProcessedAppointments),
      hint: "حالات مكتملة / حضور / جلسة",
      accent: "text-violet-400",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-zinc-50">ملخص صحة المنصة</h2>
        <p className="mt-1 text-sm text-zinc-500">
          مؤشرات مجمّعة عبر جميع العيادات — بدون بيانات مرضى (PHI)
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.key}
            className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {card.label}
            </p>
            <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums ${card.accent}`}>
              {card.value}
            </p>
            <p className="mt-2 text-xs text-zinc-600">{card.hint}</p>
          </article>
        ))}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          عيادات مسجّلة شهرياً
        </h3>
        <ClinicsOnboardedChart data={metrics.clinicsOnboardedByMonth} />
      </section>
    </div>
  );
}
