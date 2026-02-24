"use client";

import { useTimer } from "@/contexts/timer-context";
import { formatDuration } from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";

export function RestTimerOverlay() {
  const { timeRemaining, totalDuration, isRunning, isVisible, skipTimer, addTime, setVisible } = useTimer();

  if (!isVisible) return null;

  const progress = totalDuration > 0 ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 0;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/98 backdrop-blur-sm"
      onClick={() => !isRunning && setVisible(false)}
    >
      <button
        className="absolute top-4 right-4 p-2 text-muted-foreground"
        onClick={(e) => { e.stopPropagation(); setVisible(false); }}
      >
        <X className="h-6 w-6" />
      </button>

      <p className="mb-8 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {isRunning ? "Pause" : "Timer abgelaufen"}
      </p>

      <div className="relative mb-8">
        <svg width="200" height="200" className="-rotate-90">
          <circle
            cx="100" cy="100" r="90"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="100" cy="100" r="90"
            stroke="currentColor"
            className="text-primary transition-all duration-1000"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold tabular-nums">
            {formatDuration(timeRemaining)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full p-0"
          onClick={(e) => { e.stopPropagation(); addTime(-15); }}
        >
          <Minus className="h-5 w-5" />
        </Button>
        <Button
          variant="default"
          size="lg"
          className="h-14 px-8 rounded-full text-lg font-semibold"
          onClick={(e) => { e.stopPropagation(); skipTimer(); }}
        >
          Überspringen
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full p-0"
          onClick={(e) => { e.stopPropagation(); addTime(15); }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
