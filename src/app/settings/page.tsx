"use client";

import { useState } from "react";
import { Download, Upload, Trash2, Dumbbell, Scale, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { useSettings } from "@/hooks/use-settings";
import { useWorkouts } from "@/hooks/use-workouts";
import { useTemplates } from "@/hooks/use-templates";
import { useMeasurements } from "@/hooks/use-measurements";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { WeightUnit } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const { workouts } = useWorkouts();
  const { templates } = useTemplates();
  const { measurements } = useMeasurements();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleExport = () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      workouts: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUTS) || "[]"),
      templates: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || "[]"),
      folders: JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || "[]"),
      customExercises: JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES) || "[]"),
      measurements: JSON.parse(localStorage.getItem(STORAGE_KEYS.MEASUREMENTS) || "[]"),
      settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || "{}"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportiert");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.workouts) localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(data.workouts));
          if (data.templates) localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
          if (data.folders) localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(data.folders));
          if (data.customExercises) localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(data.customExercises));
          if (data.measurements) localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(data.measurements));
          if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
          toast.success("Daten importiert. Seite wird neu geladen...");
          setTimeout(() => window.location.reload(), 1000);
        } catch {
          toast.error("Ungültige Datei");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClear = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem("fitness-active-workout");
    localStorage.removeItem("fitness-elapsed");
    toast.success("Alle Daten gelöscht. Seite wird neu geladen...");
    setClearDialogOpen(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="flex flex-col gap-0">
      <PageHeader title="Profil & Einstellungen" />

      <div className="px-4 py-3 space-y-4">
        {/* Stats Overview */}
        <Card>
          <CardContent className="py-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Dumbbell className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{workouts.filter(w => w.endTime).length}</p>
                <p className="text-[10px] text-muted-foreground">Workouts</p>
              </div>
              <div>
                <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{templates.length}</p>
                <p className="text-[10px] text-muted-foreground">Vorlagen</p>
              </div>
              <div>
                <Scale className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{measurements.length}</p>
                <p className="text-[10px] text-muted-foreground">Messungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Einheiten</p>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Gewichtseinheit</Label>
              <Select
                value={settings.weightUnit}
                onValueChange={v => update({ weightUnit: v as WeightUnit })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timer */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Rest Timer</p>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Work Sets (Sek.)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={settings.defaultRestTimerWork}
                onChange={e => update({ defaultRestTimerWork: parseInt(e.target.value) || 120 })}
                className="w-20 text-center"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Warmup Sets (Sek.)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={settings.defaultRestTimerWarmup}
                onChange={e => update({ defaultRestTimerWarmup: parseInt(e.target.value) || 90 })}
                className="w-20 text-center"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Timer automatisch starten</Label>
              <Switch
                checked={settings.restTimerAutoStart}
                onCheckedChange={v => update({ restTimerAutoStart: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sound bei Timer-Ende</Label>
              <Switch
                checked={settings.restTimerSound}
                onCheckedChange={v => update({ restTimerSound: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Anzeige</p>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <Label>Vorherige Werte anzeigen</Label>
              <Switch
                checked={settings.showPreviousValues}
                onCheckedChange={v => update({ showPreviousValues: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Daten</p>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Daten exportieren (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" /> Daten importieren
            </Button>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive/30"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Alle Daten löschen
            </Button>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            FitTrack v1.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Unbegrenzte Routinen. Deine Daten, lokal gespeichert.
          </p>
          <Button
            variant="link"
            className="text-xs mt-1"
            onClick={() => router.push("/measurements")}
          >
            Körpermesswerte
          </Button>
        </div>
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alle Daten löschen?</DialogTitle>
            <DialogDescription>
              Alle Workouts, Vorlagen, Messwerte und Einstellungen werden unwiderruflich gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleClear}>Alles löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
