"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { searchPatientsQuick } from "@/actions/missionControl";

interface PatientQuickSearchProps {
  disabled?: boolean;
}

export function PatientQuickSearch({ disabled = false }: PatientQuickSearchProps) {
  const t = useTranslations("dashboard.commandCenter.ops");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; phoneNumber: string }[]
  >([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const rows = await searchPatientsQuick(query);
        setResults(rows);
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-muted" htmlFor="mc-patient-search">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          id="mc-patient-search"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 w-full rounded-lg border border-subtle bg-surface ps-8 pe-2.5 text-xs text-primary placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        />
        {pending ? (
          <Loader2 className="absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted" />
        ) : null}
      </div>
      {results.length > 0 ? (
        <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-subtle bg-surface p-1">
          {results.map((patient) => (
            <li key={patient.id}>
              <Link
                href={`/dashboard/patients/${patient.id}`}
                className="block rounded-md px-2 py-1.5 text-[11px] text-primary transition hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                <span className="font-semibold">{patient.name}</span>
                <span className="ms-1 text-muted" dir="ltr">
                  {patient.phoneNumber}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
