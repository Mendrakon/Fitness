"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface TimerContextValue {
  timeRemaining: number;
  totalDuration: number;
  isRunning: boolean;
  isVisible: boolean;
  activeExerciseId: string | null;
  activeSetId: string | null;
  startTimer: (seconds: number, exerciseInstanceId?: string, setId?: string) => void;
  skipTimer: () => void;
  addTime: (seconds: number) => void;
  setVisible: (visible: boolean) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isVisible, setVisible] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Timestamp wann der Timer ablaufen soll – bleibt korrekt auch wenn Screen aus ist
  const endTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkZeYl5GKgXVram2Dj5ecoZ+akIV5bmpviJObo6ShnpWJfXFrbYSQm6OmpKGbkYZ6bmtti5WdpKainpSIe29tbImTnKOlop6Uh3pvbW6Kk5yjpKKelId6b21uipOco6SinpSHem9tboqTnKOkop6Uh3pvbW6Kk5yj");
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishTimer = useCallback(() => {
    clearTimer();
    isRunningRef.current = false;
    setIsRunning(false);
    endTimeRef.current = null;
    try { audioRef.current?.play(); } catch {}
  }, [clearTimer]);

  const startTimer = useCallback(
    (seconds: number, exerciseInstanceId?: string, setId?: string) => {
      clearTimer();
      const endTime = Date.now() + seconds * 1000;
      endTimeRef.current = endTime;
      isRunningRef.current = true;
      setTotalDuration(seconds);
      setTimeRemaining(seconds);
      setIsRunning(true);
      setVisible(false);
      setActiveExerciseId(exerciseInstanceId ?? null);
      setActiveSetId(setId ?? null);

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining <= 0) finishTimer();
      }, 500); // 500ms damit Rücksprung nach Screen-on schnell ankommt
    },
    [clearTimer, finishTimer]
  );

  const skipTimer = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    isRunningRef.current = false;
    setTimeRemaining(0);
    setIsRunning(false);
    setVisible(false);
    setActiveExerciseId(null);
    setActiveSetId(null);
  }, [clearTimer]);

  const addTime = useCallback((seconds: number) => {
    if (endTimeRef.current) {
      endTimeRef.current += seconds * 1000;
    }
    setTimeRemaining(prev => Math.max(0, prev + seconds));
    setTotalDuration(prev => Math.max(0, prev + seconds));
  }, []);

  // Sofort korrigieren wenn Screen wieder eingeschaltet wird
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden || !isRunningRef.current || !endTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) finishTimer();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimer();
    };
  }, [clearTimer, finishTimer]);

  return (
    <TimerContext.Provider
      value={{ timeRemaining, totalDuration, isRunning, isVisible, activeExerciseId, activeSetId, startTimer, skipTimer, addTime, setVisible }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useTimer must be used within TimerProvider");
  return context;
}
