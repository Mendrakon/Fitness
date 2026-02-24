"use client";

import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useLocalStorage } from "./use-local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { BodyMeasurement } from "@/lib/types";

export function useMeasurements() {
  const [measurements, setMeasurements] = useLocalStorage<BodyMeasurement[]>(
    STORAGE_KEYS.MEASUREMENTS,
    []
  );

  const add = useCallback(
    (data: Omit<BodyMeasurement, "id">) => {
      const entry: BodyMeasurement = { ...data, id: uuid() };
      setMeasurements(prev => [entry, ...prev]);
      return entry;
    },
    [setMeasurements]
  );

  const update = useCallback(
    (id: string, updates: Partial<BodyMeasurement>) => {
      setMeasurements(prev =>
        prev.map(m => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    [setMeasurements]
  );

  const remove = useCallback(
    (id: string) => {
      setMeasurements(prev => prev.filter(m => m.id !== id));
    },
    [setMeasurements]
  );

  const getLatest = useCallback(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return sorted[0] || null;
  }, [measurements]);

  return {
    measurements: [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    add,
    update,
    remove,
    getLatest,
  };
}
