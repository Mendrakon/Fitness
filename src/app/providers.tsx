"use client";

import { ActiveWorkoutProvider } from "@/contexts/active-workout-context";
import { TimerProvider } from "@/contexts/timer-context";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RestTimerOverlay } from "@/components/workout/rest-timer-overlay";
import { Toaster } from "@/components/ui/sonner";
import { NotificationPrompt } from "@/components/notification-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ActiveWorkoutProvider>
      <TimerProvider>
        <ThemeProvider>
          {children}
          <RestTimerOverlay />
          <BottomNav />
          <NotificationPrompt />
          <Toaster position="top-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }} />
        </ThemeProvider>
      </TimerProvider>
    </ActiveWorkoutProvider>
  );
}
