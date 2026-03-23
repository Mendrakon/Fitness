"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useKlettersteigRoutes } from "@/hooks/use-klettersteig-routes";
import { useKlettersteigSessions } from "@/hooks/use-klettersteig-sessions";
import { useKlettersteigPRs } from "@/hooks/use-klettersteig-prs";
import {
  KLETTERSTEIG_DIFFICULTY_COLORS,
  KLETTERSTEIG_PR_METRIC_LABELS,
  WEATHER_LABELS,
  WEATHER_ICONS,
  WIND_LABELS,
  formatKlettersteigTime,
  formatKlettersteigPRDiff,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function KlettersteigSessionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { getById: getRoute } = useKlettersteigRoutes();
  const { sessions } = useKlettersteigSessions();
  const { prEvents } = useKlettersteigPRs();

  const session = sessions.find((s) => s.id === id);
  const route = session ? getRoute(session.routeId) : null;
  const sessionPRs = prEvents.filter((p) => p.sessionId === id);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 gap-4 text-center">
        <Mountain className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Session nicht gefunden</p>
        <Button variant="outline" onClick={() => router.back()}>Zurück</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Klettersteig-Session</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(session.startTime), "d. MMMM yyyy, HH:mm", { locale: de })} Uhr
          </p>
        </div>
      </div>

      {/* Route Info */}
      {route && (
        <Card
          className="cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => router.push(`/klettersteig/${route.id}`)}
        >
          <CardContent className="flex items-center gap-3 py-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0",
                KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty]
              )}
            >
              {route.difficulty}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{route.name}</p>
              <p className="text-xs text-muted-foreground">
                Hohe Wand{route.elevationGain ? ` · ${route.elevationGain} Hm` : ""}
              </p>
            </div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Zeit</p>
            <p className="text-2xl font-bold text-green-500">
              {formatKlettersteigTime(session.durationSeconds)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Zusatzgewicht</p>
            <p className="text-2xl font-bold text-amber-500">
              {session.extraWeightKg > 0 ? `${session.extraWeightKg} kg` : "–"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weather */}
      {session.weather && (
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-2">Wetter</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{WEATHER_ICONS[session.weather.condition]}</span>
              <div className="flex-1">
                <p className="text-sm font-medium">{WEATHER_LABELS[session.weather.condition]}</p>
                <p className="text-xs text-muted-foreground">
                  {session.weather.temperature !== null && `${session.weather.temperature}°C`}
                  {session.weather.wind && ` · Wind: ${WIND_LABELS[session.weather.wind]}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Range */}
      {session.startTime && session.endTime && (
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Zeitraum</p>
            <p className="text-sm">
              {format(new Date(session.startTime), "HH:mm", { locale: de })}
              {" – "}
              {format(new Date(session.endTime), "HH:mm", { locale: de })} Uhr
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {session.notes && (
        <Card>
          <CardContent className="py-3">
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Notizen</p>
            <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* PRs from this session */}
      {sessionPRs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            PRs dieser Session
          </h2>
          {sessionPRs.map((pr) => (
            <Card key={pr.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {KLETTERSTEIG_PR_METRIC_LABELS[pr.metric]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pr.durationSeconds > 0 && formatKlettersteigTime(pr.durationSeconds)}
                    {pr.extraWeightKg > 0 && ` · ${pr.extraWeightKg} kg`}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 text-xs font-semibold text-yellow-700 bg-yellow-500/10"
                >
                  {formatKlettersteigPRDiff(pr)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
