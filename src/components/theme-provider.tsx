"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (dark: boolean) => {
      if (dark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (settings.theme === "dark") {
      applyTheme(true);
    } else if (settings.theme === "light") {
      applyTheme(false);
    } else {
      // system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  return <>{children}</>;
}
