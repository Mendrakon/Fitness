"use client";

import { createContext, useContext, useCallback, useEffect, useRef } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { KlettersteigWeather, KlettersteigSession } from "@/lib/types";

interface ActiveKlettersteigSession {
  id: string;
  routeId: string;
  startTime: string;
  extraWeightKg: number;
  weather: KlettersteigWeather;
  notes: string;
}

interface KlettersteigSessionContextValue {
  activeSession: ActiveKlettersteigSession | null;
  startSession: (routeId: string, extraWeightKg: number, weather: KlettersteigWeather) => void;
  finishSession: () => KlettersteigSession | null;
  discardSession: () => void;
  updateNotes: (notes: string) => void;
  elapsedSeconds: number;
}

const KlettersteigSessionContext = createContext<KlettersteigSessionContextValue | null>(null);

export function KlettersteigSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useLocalStorage<ActiveKlettersteigSession | null>(
    STORAGE_KEYS.ACTIVE_KLETTERSTEIG_SESSION,
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useLocalStorage<number>(
    STORAGE_KEYS.KLETTERSTEIG_ELAPSED,
    0
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(activeSession.startTime).getTime();
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    };

    updateElapsed();
    intervalRef.current = setInterval(updateElapsed, 1000);

    const handleVisibility = () => {
      if (!document.hidden) updateElapsed();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.startTime, !!activeSession, setElapsedSeconds]);

  const startSession = useCallback(
    (routeId: string, extraWeightKg: number, weather: KlettersteigWeather) => {
      setActiveSession({
        id: uuid(),
        routeId,
        startTime: new Date().toISOString(),
        extraWeightKg,
        weather,
        notes: "",
      });
    },
    [setActiveSession]
  );

  const finishSession = useCallback((): KlettersteigSession | null => {
    if (!activeSession) return null;
    const endTime = new Date().toISOString();
    const durationSeconds = Math.floor(
      (new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000
    );
    const finished: KlettersteigSession = {
      id: activeSession.id,
      userId: "", // will be set by the save hook
      routeId: activeSession.routeId,
      startTime: activeSession.startTime,
      endTime,
      durationSeconds,
      extraWeightKg: activeSession.extraWeightKg,
      weather: activeSession.weather,
      notes: activeSession.notes,
    };
    setActiveSession(null);
    return finished;
  }, [activeSession, setActiveSession]);

  const discardSession = useCallback(() => {
    setActiveSession(null);
  }, [setActiveSession]);

  const updateNotes = useCallback(
    (notes: string) => {
      setActiveSession((prev) => (prev ? { ...prev, notes } : prev));
    },
    [setActiveSession]
  );

  return (
    <KlettersteigSessionContext.Provider
      value={{
        activeSession,
        startSession,
        finishSession,
        discardSession,
        updateNotes,
        elapsedSeconds,
      }}
    >
      {children}
    </KlettersteigSessionContext.Provider>
  );
}

export function useKlettersteigSession() {
  const context = useContext(KlettersteigSessionContext);
  if (!context) throw new Error("useKlettersteigSession must be used within KlettersteigSessionProvider");
  return context;
}
