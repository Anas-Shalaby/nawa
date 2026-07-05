import type { Service } from "@/lib/booking/types";

export type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_egp?: number | null;
  pre_visit_instructions?: string | null;
};

export function mapServiceRow(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceEgp: row.price_egp ?? null,
    preVisitInstructions: row.pre_visit_instructions?.trim() || null,
  };
}

export const SERVICE_SELECT =
  "id, name, duration_minutes, price_egp, pre_visit_instructions";

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;
