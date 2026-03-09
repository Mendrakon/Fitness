// Service Worker – FitTrack Push Notifications

// Rest-Timer: geplante Notification via message vom Haupt-Thread
let timerTimeoutId = null;

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SCHEDULE_TIMER_NOTIFICATION") {
    // Alten Timeout löschen falls vorhanden
    if (timerTimeoutId !== null) {
      clearTimeout(timerTimeoutId);
      timerTimeoutId = null;
    }
    const delayMs = event.data.endTime - Date.now();
    if (delayMs <= 0) return;
    timerTimeoutId = setTimeout(() => {
      timerTimeoutId = null;
      self.registration.showNotification("Pause vorbei!", {
        body: "Du kannst jetzt mit dem nächsten Satz weitermachen.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "rest-timer",
        renotify: true,
      });
    }, delayMs);
  }

  if (event.data.type === "CANCEL_TIMER_NOTIFICATION") {
    if (timerTimeoutId !== null) {
      clearTimeout(timerTimeoutId);
      timerTimeoutId = null;
    }
  }
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "FitTrack", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag ?? "fittrack-notification",
      renotify: true,
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/friends";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(url) && "focus" in c);
        if (existing) return existing.focus();
        return clients.openWindow(url);
      })
  );
});
