"use client";

import { useState, useEffect } from "react";
import { Download, Upload, Trash2, Dumbbell, Scale, Clock, Sun, Moon, Monitor, LogOut, User, Pencil, Check, X } from "lucide-react";
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
import type { WeightUnit, ThemeMode } from "@/lib/types";
import { createClient } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, update } = useSettings();
  const { workouts } = useWorkouts();
  const { templates } = useTemplates();
  const { measurements } = useMeasurements();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (data) setUsername(data.username);
    };
    loadProfile();
  }, []);

  const handleSaveUsername = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", user.id);
    setSavingUsername(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Nutzername bereits vergeben" : "Fehler beim Speichern");
    } else {
      setUsername(trimmed);
      setEditingUsername(false);
      toast.success("Nutzername gespeichert");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

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

        {/* Profile */}
        <Card>
          <CardHeader className="py-2.5 px-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Profil</p>
          </CardHeader>
          <CardContent className="py-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {editingUsername ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveUsername(); if (e.key === "Escape") setEditingUsername(false); }}
                      className="h-7 text-sm px-2"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveUsername} disabled={savingUsername}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingUsername(false)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{username || "—"}</p>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { setNewUsername(username); setEditingUsername(true); }}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </div>
            <Separator />
            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive/30"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Abmelden
            </Button>
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
          <CardContent className="py-2 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Design</Label>
              <div className="flex rounded-lg border p-0.5 gap-0.5">
                {([
                  { value: "light" as ThemeMode, icon: Sun, label: "Hell" },
                  { value: "system" as ThemeMode, icon: Monitor, label: "System" },
                  { value: "dark" as ThemeMode, icon: Moon, label: "Dunkel" },
                ]).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => update({ theme: value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      settings.theme === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
