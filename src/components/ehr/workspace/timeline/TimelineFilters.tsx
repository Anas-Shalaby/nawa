"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

interface TimelineFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  locale: string;
}

export function TimelineFilters({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  locale,
}: TimelineFiltersProps) {
  const t = useTranslations("ehr.workspace.timeline");
  const isAr = locale === "ar";

  const categories = [
    { id: "all", label: isAr ? "الكل" : "All" },
    { id: "visits", label: isAr ? "الزيارات" : "Visits" },
    { id: "prescriptions", label: isAr ? "الروشتات" : "Prescriptions" },
    { id: "images", label: isAr ? "الأشعة والوسائط" : "Images" },
    { id: "payments", label: isAr ? "المدفوعات" : "Payments" },
    { id: "followups", label: isAr ? "المتابعات" : "Follow-ups" },
    { id: "investigations", label: isAr ? "الفحوصات" : "Investigations" },
  ];

  return (
    <div className="space-y-4 mb-6 hide-on-print">
      
      {/* Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-muted">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isAr ? "ابحث في الملف الطبي (التشخيص، الدواء، الطبيب، التاريخ)..." : "Search diagnosis, medicine, doctor, date, notes..."}
          className="block w-full rounded-xl border border-subtle bg-surface px-10 py-2.5 text-sm placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none text-start"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onFilterChange(cat.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition border ${
              selectedFilter === cat.id
                ? "bg-accent border-accent text-white"
                : "bg-surface border-subtle/80 text-muted hover:text-primary hover:border-subtle"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

    </div>
  );
}
