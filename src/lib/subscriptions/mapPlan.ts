import type { SubscriptionPlan, SubscriptionPlanId } from "./types";

interface SubscriptionPlanRow {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  duration_months: number;
  price_egp: number;
  setup_fee_egp: number;
  sort_order: number;
}

export function mapSubscriptionPlanRow(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id as SubscriptionPlanId,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    descriptionAr: row.description_ar,
    descriptionEn: row.description_en,
    durationMonths: row.duration_months,
    priceEgp: row.price_egp,
    setupFeeEgp: row.setup_fee_egp,
    sortOrder: row.sort_order,
  };
}

export function getPlanLabel(plan: SubscriptionPlan, locale: string): string {
  return locale === "ar" ? plan.nameAr : plan.nameEn;
}

export function getPlanDescription(plan: SubscriptionPlan, locale: string): string | null {
  return locale === "ar" ? plan.descriptionAr : plan.descriptionEn;
}

export function formatPlanPrice(plan: SubscriptionPlan, locale: string): string {
  if (plan.priceEgp === 0 && plan.setupFeeEgp === 0) {
    return locale === "ar" ? "مجانًا" : "Free";
  }

  const price = plan.priceEgp.toLocaleString(locale === "ar" ? "ar-EG" : "en-US");
  if (locale === "ar") {
    return `${price} جنيه / ${plan.durationMonths} أشهر`;
  }

  return `${price} EGP / ${plan.durationMonths} mo`;
}
