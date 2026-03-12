"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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
  // Keep the timer accurate even if the screen turns off or the tab is hidden.
  const endTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const sendSwMessage = useCallback((msg: object) => {
    try {
      navigator.serviceWorker?.controller?.postMessage(msg);
    } catch {}
  }, []);

  const isNotificationEnabled = useCallback(() => {
    try {
      const stored = localStorage.getItem("fitness-settings");
      return stored ? JSON.parse(stored)?.restTimerNotification !== false : true;
    } catch {
      return true;
    }
  }, []);

  const finishTimer = useCallback(() => {
    clearTimer();
    isRunningRef.current = false;
    setIsRunning(false);
    endTimeRef.current = null;
    // The service worker already handled the background notification if needed.
    sendSwMessage({ type: "CANCEL_TIMER_NOTIFICATION" });
  }, [clearTimer, sendSwMessage]);

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
      }, 500);

      if (isNotificationEnabled() && Notification.permission === "granted") {
        sendSwMessage({ type: "SCHEDULE_TIMER_NOTIFICATION", endTime });
      }
    },
    [clearTimer, finishTimer, isNotificationEnabled, sendSwMessage]
  );

  const skipTimer = useCallback(() => {
    clearTimer();
    endTimeRef.current = null;
    isRunningRef.current = false;
    setTimeRemaining(0);
    setIsRunning(false);
    setVisible(false);
    sendSwMessage({ type: "CANCEL_TIMER_NOTIFICATION" });
    setActiveExerciseId(null);
    setActiveSetId(null);
  }, [clearTimer, sendSwMessage]);

  const addTime = useCallback((seconds: number) => {
    if (endTimeRef.current) {
      endTimeRef.current += seconds * 1000;
      if (isNotificationEnabled() && Notification.permission === "granted") {
        sendSwMessage({ type: "SCHEDULE_TIMER_NOTIFICATION", endTime: endTimeRef.current });
      }
    }

    setTimeRemaining(prev => Math.max(0, prev + seconds));
    setTotalDuration(prev => Math.max(0, prev + seconds));
  }, [isNotificationEnabled, sendSwMessage]);

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
