"use client";

import { useTranslations } from "next-intl";
import type {
  AttentionItem,
  ClinicRoomStatus,
  DoctorOperationalStatus,
  MissionControlInsight,
  MissionControlMetrics,
  PaymentTickerItem,
  UnpaidCollectItem,
} from "@/lib/dashboard/types";
import { DoctorStatusCard } from "./DoctorStatusCard";
import { CashAndBalancesCard } from "./CashAndBalancesCard";
import { CapacityHealthCard } from "./CapacityHealthCard";
import { AttentionCenter } from "./AttentionCenter";
import { SmartInsightsCard } from "./SmartInsightsCard";

interface ClinicRadarPanelProps {
  rooms: ClinicRoomStatus[];
  doctors: DoctorOperationalStatus[];
  metrics: MissionControlMetrics;
  canViewRevenue: boolean;
  todayPayments: PaymentTickerItem[];
  yesterdayUnpaid: UnpaidCollectItem[];
  attentionItems: AttentionItem[];
  insights: MissionControlInsight[];
  numberLocale: string;
}

export function ClinicRadarPanel({
  rooms,
  doctors,
  metrics,
  canViewRevenue,
  todayPayments,
  yesterdayUnpaid,
  attentionItems,
  insights,
  numberLocale,
}: ClinicRadarPanelProps) {
  const t = useTranslations("dashboard.commandCenter.radar");
  const tAttention = useTranslations("dashboard.commandCenter.attention");

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-subtle bg-surface p-3 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
      <DoctorStatusCard doctors={doctors} />

      <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
        <h2 className="mb-2 text-xs font-semibold text-primary">{t("roomsTitle")}</h2>
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="flex items-start gap-2 rounded-lg border border-subtle bg-surface px-2.5 py-2"
            >
              <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
                {room.busy ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-danger opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-danger" />
                  </>
                ) : (
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-success" />
                )}
              </span>
              <div className="min-w-0 text-start">
                <p className="truncate text-xs font-semibold text-primary">{room.label}</p>
                <p
                  className={[
                    "truncate text-[11px]",
                    room.busy ? "text-accent-danger" : "text-accent-success",
                  ].join(" ")}
                >
                  {room.busy
                    ? t("busyWith", { service: room.detail })
                    : t("available")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CashAndBalancesCard
        canViewRevenue={canViewRevenue}
        todayPayments={todayPayments}
        yesterdayUnpaid={yesterdayUnpaid}
        todayRevenueEgp={metrics.todayRevenueEgp}
        numberLocale={numberLocale}
      />

      <CapacityHealthCard
        capacityPct={metrics.capacityPct}
        remainingLoadMinutes={metrics.remainingLoadMinutes}
      />

      <section className="rounded-xl border border-subtle bg-elevated/50 p-3">
        <h2 className="mb-2 text-xs font-semibold text-primary">{tAttention("title")}</h2>
        <AttentionCenter items={attentionItems} />
      </section>

      <SmartInsightsCard insights={insights} />
    </aside>
  );
}
