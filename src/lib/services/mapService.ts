import type { Service } from "@/lib/booking/types";

export type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_egp?: number | null;
  pre_visit_instructions?: string | null;
  is_package?: boolean | null;
  sessions_count?: number | null;
  color_code?: string | null;
};

export function mapServiceRow(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceEgp: row.price_egp ?? null,
    preVisitInstructions: row.pre_visit_instructions?.trim() || null,
    isPackage: row.is_package ?? false,
    sessionsCount: Math.max(row.sessions_count ?? 1, 1),
    colorCode: row.color_code?.trim() || null,
  };
}

export const SERVICE_SELECT =
  "id, name, duration_minutes, price_egp, pre_visit_instructions, is_package, sessions_count, color_code";

export const DURATION_OPTIONS = [15, 30, 45, 60] as const;
