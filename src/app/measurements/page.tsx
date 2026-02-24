"use client";

import { useState, useMemo } from "react";
import { Plus, Scale, Percent, Flame, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter
} from "@/components/ui/drawer";
import { PageHeader } from "@/components/layout/page-header";
import { useMeasurements } from "@/hooks/use-measurements";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function MeasurementsPage() {
  const { measurements, add, remove, getLatest } = useMeasurements();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [calories, setCalories] = useState("");

  const latest = getLatest();

  const handleAdd = () => {
    add({
      date: new Date().toISOString(),
      weight: weight ? parseFloat(weight) : null,
      bodyFatPercent: bodyFat ? parseFloat(bodyFat) : null,
      calories: calories ? parseInt(calories) : null,
    });
    setWeight("");
    setBodyFat("");
    setCalories("");
    setDrawerOpen(false);
  };

  // Chart data (chronological order)
  const weightChartData = useMemo(() =>
    [...measurements]
      .filter(m => m.weight !== null)
      .reverse()
      .map(m => ({
        date: format(new Date(m.date), "d.M.", { locale: de }),
        value: m.weight,
      })),
    [measurements]
  );

  const bfChartData = useMemo(() =>
    [...measurements]
      .filter(m => m.bodyFatPercent !== null)
      .reverse()
      .map(m => ({
        date: format(new Date(m.date), "d.M.", { locale: de }),
        value: m.bodyFatPercent,
      })),
    [measurements]
  );

  const calChartData = useMemo(() =>
    [...measurements]
      .filter(m => m.calories !== null)
      .reverse()
      .map(m => ({
        date: format(new Date(m.date), "d.M.", { locale: de }),
        value: m.calories,
      })),
    [measurements]
  );

  const renderChart = (data: { date: string; value: number | null }[], color: string, unit: string) => {
    if (data.length < 2) return (
      <div className="flex flex-col items-center py-8 text-center">
        <BarChart3 className="h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">Mindestens 2 Einträge für Chart</p>
      </div>
    );
    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value?: number) => [`${value ?? ""} ${unit}`, ""]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader
        title="Messwerte"
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <div className="px-4 py-3 space-y-4">
        {/* Current values */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-3 text-center">
              <Scale className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{latest?.weight ?? "-"}</p>
              <p className="text-[10px] text-muted-foreground">kg</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <Percent className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{latest?.bodyFatPercent ?? "-"}</p>
              <p className="text-[10px] text-muted-foreground">KFA %</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 text-center">
              <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{latest?.calories ?? "-"}</p>
              <p className="text-[10px] text-muted-foreground">kcal</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="weight">
          <TabsList className="w-full">
            <TabsTrigger value="weight" className="flex-1">Gewicht</TabsTrigger>
            <TabsTrigger value="bodyfat" className="flex-1">KFA</TabsTrigger>
            <TabsTrigger value="calories" className="flex-1">Kalorien</TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="mt-3 space-y-3">
            <Card>
              <CardContent className="py-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Gewichtsverlauf</h4>
                {renderChart(weightChartData, "hsl(var(--primary))", "kg")}
              </CardContent>
            </Card>
            <div className="space-y-1.5">
              {measurements.filter(m => m.weight !== null).map(m => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-sm">{m.weight} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.date), "d. MMM yyyy", { locale: de })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {measurements.filter(m => m.weight !== null).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Noch keine Einträge</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bodyfat" className="mt-3 space-y-3">
            <Card>
              <CardContent className="py-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">KFA-Verlauf</h4>
                {renderChart(bfChartData, "hsl(var(--chart-5))", "%")}
              </CardContent>
            </Card>
            <div className="space-y-1.5">
              {measurements.filter(m => m.bodyFatPercent !== null).map(m => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-sm">{m.bodyFatPercent}%</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.date), "d. MMM yyyy", { locale: de })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {measurements.filter(m => m.bodyFatPercent !== null).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Noch keine Einträge</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calories" className="mt-3 space-y-3">
            <Card>
              <CardContent className="py-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Kalorienverlauf</h4>
                {renderChart(calChartData, "hsl(var(--chart-2))", "kcal")}
              </CardContent>
            </Card>
            <div className="space-y-1.5">
              {measurements.filter(m => m.calories !== null).map(m => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="font-medium text-sm">{m.calories} kcal</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(m.date), "d. MMM yyyy", { locale: de })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {measurements.filter(m => m.calories !== null).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Noch keine Einträge</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Messwert eintragen</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-4 px-4 pb-2">
            <div className="space-y-1.5">
              <Label>Gewicht (kg)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="z.B. 80.5"
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Körperfettanteil (%)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="z.B. 15.0"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kalorien (kcal)</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 2500"
                value={calories}
                onChange={e => setCalories(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleAdd} disabled={!weight && !bodyFat && !calories}>
              Speichern
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
