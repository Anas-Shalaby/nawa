"use client";

import { useState, useTransition } from "react";
import { setClinicActive } from "@/actions/superAdminClinics";
import type { SuperAdminClinicRow } from "@/lib/super-admin/clinics";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));
}

interface ClinicsTableProps {
  clinics: SuperAdminClinicRow[];
}

export function ClinicsTable({ clinics: initialClinics }: ClinicsTableProps) {
  const [clinics, setClinics] = useState(initialClinics);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleToggle(clinic: SuperAdminClinicRow) {
    const nextActive = !clinic.isActive;
    setPendingId(clinic.id);
    setClinics((current) =>
      current.map((row) =>
        row.id === clinic.id ? { ...row, isActive: nextActive } : row,
      ),
    );

    startTransition(async () => {
      const result = await setClinicActive(clinic.id, nextActive);
      if (!result.success) {
        setClinics((current) =>
          current.map((row) =>
            row.id === clinic.id ? { ...row, isActive: clinic.isActive } : row,
          ),
        );
      }
      setPendingId(null);
    });
  }

  if (clinics.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] px-6 py-14 text-center text-sm text-zinc-500">
        لا توجد عيادات مسجّلة بعد
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0a0a0c]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-start text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">العيادة</th>
              <th className="px-4 py-3 font-medium">الرابط</th>
              <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">آخر نشاط</th>
              <th className="px-4 py-3 font-medium">تعليق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {clinics.map((clinic) => {
              const statusLabel = clinic.isActive
                ? clinic.isRecentlyActive
                  ? "نشطة"
                  : "خاملة"
                : "معلّقة";

              const statusClass = clinic.isActive
                ? clinic.isRecentlyActive
                  ? "text-emerald-400"
                  : "text-zinc-400"
                : "text-red-400";

              return (
                <tr key={clinic.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-3 font-medium text-zinc-100">{clinic.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400" dir="ltr">
                    /{clinic.slug}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(clinic.createdAt)}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${statusClass}`}>
                    {statusLabel}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {formatDate(clinic.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={clinic.isActive}
                      disabled={pendingId === clinic.id}
                      onClick={() => handleToggle(clinic)}
                      className={[
                        "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition",
                        clinic.isActive
                          ? "border-emerald-600/50 bg-emerald-600/20"
                          : "border-red-600/50 bg-red-600/20",
                        pendingId === clinic.id ? "opacity-50" : "",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "absolute top-0.5 h-5 w-5 rounded-full bg-zinc-200 transition",
                          clinic.isActive ? "start-0.5" : "start-[calc(100%-1.375rem)]",
                        ].join(" ")}
                      />
                      <span className="sr-only">
                        {clinic.isActive ? "تعليق العيادة" : "تفعيل العيادة"}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
