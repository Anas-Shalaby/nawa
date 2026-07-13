"use server";

import type { AppNotification } from "@/lib/notifications/types";
import {
  formatAppointmentTime,
  getCairoDayQueryBounds,
  getCairoTodayKey,
} from "@/lib/datetime/cairo";
import { createAuthenticatedClient, resolveTenantId } from "@/utils/supabase/auth";

export type InboxNotificationSeed = Omit<AppNotification, "read">;

/**
 * Server-side seed for the unified notifications inbox.
 */
export async function fetchInboxNotifications(
  locale = "ar",
): Promise<InboxNotificationSeed[]> {
  try {
    const supabase = await createAuthenticatedClient();
    const tenantId = await resolveTenantId(supabase);
    const todayKey = getCairoTodayKey();
    const { startIso, endExclusiveIso } = getCairoDayQueryBounds(todayKey);
    const items: InboxNotificationSeed[] = [];

    const [inventoryResult, debtResult, canceledResult] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("id, name, quantity, min_threshold")
        .eq("tenant_id", tenantId)
        .order("quantity", { ascending: true })
        .limit(40),
      supabase
        .from("patients")
        .select("id, name, phone_number, total_balance_due")
        .eq("tenant_id", tenantId)
        .gt("total_balance_due", 0)
        .order("total_balance_due", { ascending: false })
        .limit(12),
      supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          patients ( id, name, phone_number ),
          services ( name )
        `,
        )
        .eq("tenant_id", tenantId)
        .eq("status", "canceled")
        .gte("appointment_date", startIso)
        .lt("appointment_date", endExclusiveIso)
        .order("appointment_date", { ascending: false })
        .limit(10),
    ]);

    const isAr = locale.startsWith("ar");

    for (const row of inventoryResult.data ?? []) {
      if (row.quantity > (row.min_threshold ?? 0)) continue;
      const outOfStock = row.quantity <= 0;
      items.push({
        id: `inventory-${row.id}`,
        kind: "inventory",
        title: outOfStock
          ? isAr
            ? "نفاد المخزون"
            : "Out of stock"
          : isAr
            ? "مخزون منخفض"
            : "Low stock",
        body: outOfStock
          ? isAr
            ? `${row.name} خلص من العيادة.`
            : `${row.name} is out of stock.`
          : isAr
            ? `${row.name}: متبقي ${row.quantity} (الحد ${row.min_threshold}).`
            : `${row.name}: ${row.quantity} left (min ${row.min_threshold}).`,
        createdAt: Date.now() - 60_000,
        urgent:
          outOfStock ||
          row.quantity <= Math.max(1, Math.floor((row.min_threshold ?? 1) / 2)),
        actionHref: "/dashboard/inventory",
        actionLabelKey: "confirmRestock",
        meta: {
          inventoryItemId: row.id,
          inventoryName: row.name,
          inventoryQuantity: row.quantity,
          inventoryMinThreshold: row.min_threshold ?? 0,
        },
      });
    }

    for (const row of debtResult.data ?? []) {
      items.push({
        id: `debt-${row.id}`,
        kind: "financial",
        title: isAr ? "مستحقات متأخرة" : "Outstanding balance",
        body: isAr
          ? `${row.name} عليه مبلغ ${row.total_balance_due} ج.م`
          : `${row.name} owes ${row.total_balance_due} EGP`,
        createdAt: Date.now() - 120_000,
        urgent: (row.total_balance_due ?? 0) >= 1000,
        actionHref: `/dashboard/patients/${row.id}`,
        actionLabelKey: "sendPaymentLink",
        meta: {
          patientId: row.id,
          patientName: row.name,
          phoneNumber: row.phone_number ?? "",
          amountEgp: row.total_balance_due ?? 0,
        },
      });
    }

    type CanceledRow = {
      id: string;
      appointment_date: string;
      patients?:
        | { id: string; name: string; phone_number: string }
        | { id: string; name: string; phone_number: string }[]
        | null;
      services?: { name: string } | { name: string }[] | null;
    };

    for (const row of (canceledResult.data ?? []) as CanceledRow[]) {
      const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients;
      const service = Array.isArray(row.services) ? row.services[0] : row.services;
      const timeLabel = formatAppointmentTime(row.appointment_date, locale);
      const name = patient?.name ?? (isAr ? "مريض" : "Patient");
      items.push({
        id: `cancel-${row.id}`,
        kind: "cancellation",
        title: isAr ? "موعد ملغي — فترة متاحة" : "Cancelled — slot freed",
        body: isAr
          ? `ألغي موعد ${name} (${service?.name ?? "خدمة"}) الساعة ${timeLabel}.`
          : `${name}'s ${service?.name ?? "service"} at ${timeLabel} was cancelled.`,
        createdAt: new Date(row.appointment_date).getTime() || Date.now(),
        urgent: false,
        actionHref: "/dashboard/upcoming",
        actionLabelKey: "openPublicSlot",
        meta: {
          appointmentId: row.id,
          patientId: patient?.id,
          patientName: name,
          phoneNumber: patient?.phone_number,
          serviceName: service?.name,
          timeLabel,
          appointmentDateIso: row.appointment_date,
        },
      });
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}
