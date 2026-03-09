"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (dark: boolean, gymDark = false) => {
      root.classList.toggle("dark", dark || gymDark);
      root.classList.toggle("gym-dark", gymDark);
    };

    if (settings.theme === "gym-dark") {
      applyTheme(false, true);
    } else if (settings.theme === "dark") {
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

  useEffect(() => {
    const root = document.documentElement;

    // Base oklch values per accent (light theme values; dark/gym-dark get boosted below)
    const BASE: Record<string, [number, number, number]> = {
      blue:   [0.55, 0.20, 260],
      purple: [0.55, 0.22, 295],
      green:  [0.52, 0.18, 145],
      orange: [0.60, 0.19,  55],
      red:    [0.55, 0.22,  25],
      pink:   [0.56, 0.22, 330],
    };

    const accents = ["accent-purple", "accent-green", "accent-orange", "accent-red", "accent-pink"];
    accents.forEach(c => root.classList.remove(c));

    const color = settings.accentColor ?? "blue";
    const strength = (settings.accentStrength ?? 100) / 100;
    const [baseL, baseC, baseH] = BASE[color] ?? BASE.blue;

    // At strength=0 → near monochrome (C=0.02), at strength=1 → full chroma
    const C = 0.02 + (baseC - 0.02) * strength;
    // Boost L/C slightly for dark & gym-dark
    const isDark = root.classList.contains("dark") || root.classList.contains("gym-dark");
    const L = isDark ? baseL + 0.08 : baseL;
    const finalC = isDark ? C * 1.1 : C;

    root.style.setProperty("--primary", `oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH})`);
    root.style.setProperty("--ring",    `oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH})`);
    root.style.setProperty("--sidebar-primary", `oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH})`);
    root.style.setProperty("--sidebar-ring",    `oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH})`);

    // Also update glow vars in gym-dark
    if (root.classList.contains("gym-dark")) {
      const gc = `oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH})`;
      root.style.setProperty("--glow-color", gc);
      root.style.setProperty("--glow-sm",  `0 0 8px oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH} / 0.55)`);
      root.style.setProperty("--glow-md",  `0 0 16px oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH} / 0.50), 0 0 32px oklch(${L.toFixed(3)} ${finalC.toFixed(3)} ${baseH} / 0.25)`);
    }
  }, [settings.accentColor, settings.accentStrength, settings.theme]);

  return <>{children}</>;
}
