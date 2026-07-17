"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface MissionControlNowContextValue {
  now: number;
}

const MissionControlNowContext = createContext<MissionControlNowContextValue>({
  now: Date.now(),
});

export function MissionControlNowProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <MissionControlNowContext.Provider value={{ now }}>
      {children}
    </MissionControlNowContext.Provider>
  );
}

export function useMissionControlNow(): number {
  return useContext(MissionControlNowContext).now;
}
