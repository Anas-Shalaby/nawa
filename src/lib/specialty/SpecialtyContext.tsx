"use client";

import { createContext, useContext, useMemo } from "react";

interface SpecialtyContextValue {
  specialty: string;
  isPsychiatry: boolean;
}

const SpecialtyContext = createContext<SpecialtyContextValue>({
  specialty: "",
  isPsychiatry: false,
});

const PSYCHIATRY_KEYWORDS = [
  "psychiatry",
  "psychiatric",
  "طب نفسي",
  "نفسي",
  "الطب النفسي",
];

function detectPsychiatry(specialty: string): boolean {
  const lower = specialty.trim().toLowerCase();
  return PSYCHIATRY_KEYWORDS.some((kw) => lower.includes(kw));
}

interface SpecialtyProviderProps {
  specialty: string;
  children: React.ReactNode;
}

export function SpecialtyProvider({ specialty, children }: SpecialtyProviderProps) {
  const value = useMemo<SpecialtyContextValue>(
    () => ({
      specialty,
      isPsychiatry: detectPsychiatry(specialty),
    }),
    [specialty],
  );

  return (
    <SpecialtyContext.Provider value={value}>
      {children}
    </SpecialtyContext.Provider>
  );
}

export function useSpecialty(): SpecialtyContextValue {
  return useContext(SpecialtyContext);
}
