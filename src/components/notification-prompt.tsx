"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerServiceWorker, subscribeToPush } from "@/lib/push-client";

const DISMISSED_KEY = "notif-prompt-dismissed";

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Service Worker schon mal registrieren (brauchen wir sowieso)
    registerServiceWorker();

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Im PWA-Modus direkt anzeigen, im Browser nach 3s
    const delay = isStandalone ? 1500 : 3000;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, []);

  async function handleAllow() {
    setVisible(false);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeToPush();
    }
  }

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-[5.5rem] left-0 right-0 z-50 mx-auto max-w-lg px-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border bg-background shadow-xl p-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Benachrichtigungen aktivieren</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Erhalte eine Meldung wenn du eine Freundschaftsanfrage bekommst – auch wenn die App geschlossen ist.
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="h-8 text-xs" onClick={handleAllow}>
              Erlauben
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={handleDismiss}>
              Nicht jetzt
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
