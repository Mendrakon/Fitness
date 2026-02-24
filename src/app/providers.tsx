"use client";

import { ActiveWorkoutProvider } from "@/contexts/active-workout-context";
import { TimerProvider } from "@/contexts/timer-context";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RestTimerOverlay } from "@/components/workout/rest-timer-overlay";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActiveWorkoutProvider>
      <TimerProvider>
        {children}
        <RestTimerOverlay />
        <BottomNav />
        <Toaster position="top-center" />
      </TimerProvider>
    </ActiveWorkoutProvider>
  );
}
