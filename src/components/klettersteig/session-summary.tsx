"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  KLETTERSTEIG_DIFFICULTY_COLORS,
  WEATHER_ICONS,
  WEATHER_LABELS,
  WIND_LABELS,
  KLETTERSTEIG_PR_METRIC_LABELS,
  formatKlettersteigTime,
  formatKlettersteigPRDiff,
} from "@/lib/types";
import type { KlettersteigRoute, KlettersteigSession, KlettersteigPREvent } from "@/lib/types";
import type { FeedVisibility } from "@/hooks/use-activity-feed";
import { cn } from "@/lib/utils";
import { Globe, Users, X } from "lucide-react";

interface SessionSummaryProps {
  route: KlettersteigRoute;
  session: KlettersteigSession;
  prs: KlettersteigPREvent[];
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: (visibility: FeedVisibility | null) => void;
}

export function SessionSummary({
  route,
  session,
  prs,
  notes,
  onNotesChange,
  onSave,
}: SessionSummaryProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShare = (visibility: FeedVisibility | null) => {
    setShareDialogOpen(false);
    onSave(visibility);
  };

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-28 gap-5">
      {/* Header */}
      <div className="text-center">
        <p className="text-3xl">🏔️</p>
        <h1 className="text-xl font-bold mt-2">Session abgeschlossen!</h1>
        <p className="text-sm text-muted-foreground">
          {route.name} ·{" "}
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white",
              KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty]
            )}
          >
            {route.difficulty}
          </span>
        </p>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Zeit</p>
          <p className="text-xl font-bold">{formatKlettersteigTime(session.durationSeconds)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Gewicht</p>
          <p className="text-xl font-bold">{session.extraWeightKg} kg</p>
        </div>
      </div>

      {/* PRs */}
      {prs.length > 0 && (
        <div className="w-full max-w-xs space-y-2">
          {prs.map((pr) => (
            <div
              key={pr.id}
              className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2"
            >
              <p className="text-sm font-semibold text-green-500">
                🏆 Neuer PR: {KLETTERSTEIG_PR_METRIC_LABELS[pr.metric]}
              </p>
              <p className="text-xs text-green-500/80">{formatKlettersteigPRDiff(pr)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Weather */}
      <div className="rounded-lg bg-muted/50 px-3 py-2 w-full max-w-xs text-center">
        <p className="text-xs text-muted-foreground">
          {WEATHER_ICONS[session.weather.condition]} {WEATHER_LABELS[session.weather.condition]}
          {session.weather.temperature !== null && ` · ${session.weather.temperature}°C`}
          {session.weather.wind && ` · ${WIND_LABELS[session.weather.wind]}`}
        </p>
      </div>

      {/* Notes */}
      <div className="w-full max-w-xs">
        <Textarea
          placeholder="Notizen zur Session..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full max-w-xs">
        <Button className="flex-1 h-11 font-semibold" onClick={() => onSave(null)}>
          💾 Speichern
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => setShareDialogOpen(true)}
        >
          📤 Teilen
        </Button>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={() => setShareDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session teilen?</DialogTitle>
            <DialogDescription>
              Wähle, wer deine Klettersteig-Session sehen kann.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-1">
            <button
              onClick={() => handleShare("global")}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Global</p>
                <p className="text-xs text-muted-foreground">Alle Nutzer können es sehen</p>
              </div>
            </button>
            <button
              onClick={() => handleShare("friends")}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nur Freunde</p>
                <p className="text-xs text-muted-foreground">Nur deine Freunde sehen es</p>
              </div>
            </button>
            <button
              onClick={() => handleShare(null)}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <X className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nicht teilen</p>
                <p className="text-xs text-muted-foreground">Nur in deinem Verlauf sichtbar</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
