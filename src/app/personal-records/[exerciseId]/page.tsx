"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePersonalRecords } from "@/hooks/use-personal-records";
import { useExercises } from "@/hooks/use-exercises";
import { PR_METRIC_LABELS, formatPRDiff } from "@/lib/types";
import type { PRMetric } from "@/lib/types";
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

const METRICS: PRMetric[] = ["weight", "reps", "volume", "estimated1rm"];

export default function ExercisePRDetailPage() {
  const router = useRouter();
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const { getForExercise, getTimeline } = usePersonalRecords();
  const { getById: getExercise } = useExercises();

  const [selectedMetric, setSelectedMetric] = useState<PRMetric>("weight");
  const [timeRange, setTimeRange] = useState(0); // 0 = all

  const exercise = getExercise(exerciseId);
  const allPRs = getForExercise(exerciseId);
  const timeline = getTimeline(exerciseId, selectedMetric);

  const filteredTimeline = useMemo(() => {
    if (timeRange === 0) return timeline;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    return timeline.filter((t) => new Date(t.date) >= cutoff);
  }, [timeline, timeRange]);

  const chartData = useMemo(
    () =>
      filteredTimeline.map((t) => ({
        date: format(new Date(t.date), "d. MMM", { locale: de }),
        value: t.newValue,
      })),
    [filteredTimeline]
  );

  const filteredPRs = useMemo(() => {
    if (timeRange === 0) return allPRs;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - timeRange);
    return allPRs.filter((pr) => new Date(pr.date) >= cutoff);
  }, [allPRs, timeRange]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{exercise?.name ?? "Übung"}</h1>
          <p className="text-xs text-muted-foreground">Personal Records</p>
        </div>
      </div>

      {/* Metric Chips */}
      <div className="flex gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedMetric === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            onClick={() => setSelectedMetric(m)}
          >
            {PR_METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Time Range Chips */}
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
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  name={PR_METRIC_LABELS[selectedMetric]}
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

      {/* PR Events Table */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Alle PRs
        </h2>
        {filteredPRs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Keine PRs im gewählten Zeitraum
          </p>
        ) : (
          filteredPRs.map((pr) => {
            const diffLabel = formatPRDiff(pr);
            return (
              <Card key={pr.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} Wdh`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(pr.date), "d. MMM yyyy", { locale: de })}
                      {" · "}
                      {PR_METRIC_LABELS[pr.metric]}
                      {pr.oldValue > 0 && ` · vorher: ${pr.oldValue}`}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-xs font-semibold text-yellow-700 bg-yellow-500/10"
                  >
                    {diffLabel}
                  </Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
