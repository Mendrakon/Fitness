"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isHydrated = useRef(false);

  // Hydrate from localStorage after mount (client only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // ignore
    }
    isHydrated.current = true;
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(newValue));
        // Defer event dispatch to avoid setState-during-render in other hooks
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent("local-storage", { detail: { key } }));
        });
      }
      return newValue;
    });
  }, [key]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === key) {
        try {
          const item = window.localStorage.getItem(key);
          setStoredValue(item ? JSON.parse(item) : initialValue);
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("local-storage", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("local-storage", handleCustom);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}
