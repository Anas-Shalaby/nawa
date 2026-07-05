"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface TheaterModeContextValue {
  isTheater: boolean;
  patientName: string | null;
  enterTheater: (patientName: string) => void;
  exitTheater: () => void;
}

const TheaterModeContext = createContext<TheaterModeContextValue | null>(null);

export function TheaterModeProvider({ children }: { children: React.ReactNode }) {
  const [isTheater, setIsTheater] = useState(false);
  const [patientName, setPatientName] = useState<string | null>(null);

  const enterTheater = useCallback((name: string) => {
    setPatientName(name);
    setIsTheater(true);
  }, []);

  const exitTheater = useCallback(() => {
    setIsTheater(false);
    setPatientName(null);
  }, []);

  const value = useMemo(
    () => ({ isTheater, patientName, enterTheater, exitTheater }),
    [isTheater, patientName, enterTheater, exitTheater],
  );

  return (
    <TheaterModeContext.Provider value={value}>{children}</TheaterModeContext.Provider>
  );
}

export function useTheaterMode(): TheaterModeContextValue {
  const context = useContext(TheaterModeContext);
  if (!context) {
    return {
      isTheater: false,
      patientName: null,
      enterTheater: () => {},
      exitTheater: () => {},
    };
  }
  return context;
}
