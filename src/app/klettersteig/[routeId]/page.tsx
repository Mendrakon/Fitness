"use client";

import { useState, useMemo } from "react";
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
  WEATHER_ICONS,
  formatKlettersteigTime,
  formatKlettersteigPRDiff,
} from "@/lib/types";
import type { KlettersteigPRMetric } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const TIME_RANGES = [
  { label: "30T", days: 30 },
  { label: "90T", days: 90 },
  { label: "1J", days: 365 },
  { label: "Alle", days: 0 },
] as const;

export default function KlettersteigRouteDetailPage() {
  const router = useRouter();
  const { routeId } = useParams<{ routeId: string }>();
  const { getById } = useKlettersteigRoutes();
  const { getForRoute, getBestTime, getMaxWeight } = useKlettersteigSessions();
  const { getForRoute: getPRsForRoute } = useKlettersteigPRs();

  const [selectedMetric, setSelectedMetric] = useState<"time" | "weight">("time");
  const [timeRange, setTimeRange] = useState(0);

  const route = getById(routeId);
  const sessions = getForRoute(routeId);
  const bestTime = getBestTime(routeId);
  const maxWeight = getMaxWeight(routeId);
  const prs = getPRsForRoute(routeId);

  const filteredSessions = useMemo(() => {
    if (timeRange === 0) return sessions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    return sessions.filter((s) => new Date(s.startTime) >= cutoff);
  }, [sessions, timeRange]);

  const chartData = useMemo(
    () =>
      [...filteredSessions]
        .reverse()
        .map((s) => ({
          date: format(new Date(s.startTime), "d. MMM", { locale: de }),
          value:
            selectedMetric === "time"
              ? Math.round(s.durationSeconds / 60 * 10) / 10
              : s.extraWeightKg,
        })),
    [filteredSessions, selectedMetric]
  );

  const avgTime = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / sessions.length)
    : null;

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20 gap-4 text-center">
        <Mountain className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Route nicht gefunden</p>
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
        <div className="flex items-center gap-3 flex-1">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0",
              KLETTERSTEIG_DIFFICULTY_COLORS[route.difficulty]
            )}
          >
            {route.difficulty}
          </div>
          <div>
            <h1 className="text-xl font-bold">{route.name}</h1>
            <p className="text-xs text-muted-foreground">
              Hohe Wand{route.elevationGain ? ` · ${route.elevationGain} Hm` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Bestzeit</p>
            <p className="text-2xl font-bold text-green-500">
              {bestTime ? formatKlettersteigTime(bestTime) : "–"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Max. Gewicht</p>
            <p className="text-2xl font-bold text-amber-500">
              {maxWeight ? `${maxWeight} kg` : "–"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Sessions</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Ø Zeit</p>
            <p className="text-2xl font-bold text-blue-500">
              {avgTime ? formatKlettersteigTime(avgTime) : "–"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Metric Toggle */}
      <div className="flex gap-1.5">
        {(["time", "weight"] as const).map((m) => (
          <button
            key={m}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetric === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedMetric(m)}
          >
            {m === "time" ? "Zeit (min)" : "Gewicht (kg)"}
          </button>
        ))}
      </div>

      {/* Time Range */}
      <div className="flex gap-1.5">
        {TIME_RANGES.map((tr) => (
          <button
            key={tr.label}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              timeRange === tr.days
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => setTimeRange(tr.days)}
          >
            {tr.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={selectedMetric === "time" ? "hsl(142 71% 45%)" : "hsl(38 92% 50%)"}
                  strokeWidth={2}
                  dot={{ r: 3, fill: selectedMetric === "time" ? "hsl(142 71% 45%)" : "hsl(38 92% 50%)" }}
                  name={selectedMetric === "time" ? "Minuten" : "kg"}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Nicht genug Daten für Chart
          </CardContent>
        </Card>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Personal Records
          </h2>
          {prs.map((pr) => (
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
                    {format(new Date(pr.date), "d. MMM yyyy", { locale: de })}
                    {pr.durationSeconds > 0 && ` · ${formatKlettersteigTime(pr.durationSeconds)}`}
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

      {/* Sessions List */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Alle Sessions ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Noch keine Sessions für diese Route
          </p>
        ) : (
          sessions.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(`/klettersteig/session/${s.id}`)}
            >
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">
                    {formatKlettersteigTime(s.durationSeconds)}
                    {s.extraWeightKg > 0 && (
                      <span className="text-muted-foreground"> · {s.extraWeightKg} kg</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(s.startTime), "d. MMM yyyy, HH:mm", { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  {s.weather?.condition && WEATHER_ICONS[s.weather.condition]}
                  {bestTime === s.durationSeconds && (
                    <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                      PR
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
