"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface TimerContextValue {
  timeRemaining: number;
  totalDuration: number;
  isRunning: boolean;
  isVisible: boolean;
  startTimer: (seconds: number) => void;
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const startTimer = useCallback(
    (seconds: number) => {
      clearTimer();
      setTotalDuration(seconds);
      setTimeRemaining(seconds);
      setIsRunning(true);
      setVisible(true);
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            try {
              audioRef.current?.play();
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const skipTimer = useCallback(() => {
    clearTimer();
    setTimeRemaining(0);
    setIsRunning(false);
    setVisible(false);
  }, [clearTimer]);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
    setTotalDuration(prev => Math.max(0, prev + seconds));
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <TimerContext.Provider
      value={{ timeRemaining, totalDuration, isRunning, isVisible, startTimer, skipTimer, addTime, setVisible }}
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
