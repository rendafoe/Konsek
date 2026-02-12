"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "konsek_night_mode";

function isNightByTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
}

/** Returns "day" or "night" bucket for the current time */
function getTimeBucket(): string {
  return isNightByTime() ? "night" : "day";
}

interface NightModeContextValue {
  isNight: boolean;
  toggleNight: () => void;
}

const NightModeContext = createContext<NightModeContextValue | null>(null);

export function NightModeProvider({ children }: { children: React.ReactNode }) {
  const [isNight, setIsNight] = useState<boolean>(() => {
    // Check localStorage for a manual override that's still in the same time bucket
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { value, bucket } = JSON.parse(stored);
          if (bucket === getTimeBucket()) {
            return value;
          }
          // Stale bucket — discard
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    }
    return isNightByTime();
  });

  const toggleNight = useCallback(() => {
    setIsNight((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ value: next, bucket: getTimeBucket() }),
        );
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 60-second interval: auto-reset when time bucket changes
  useEffect(() => {
    let lastBucket = getTimeBucket();

    const interval = setInterval(() => {
      const currentBucket = getTimeBucket();
      if (currentBucket !== lastBucket) {
        lastBucket = currentBucket;
        const nightNow = isNightByTime();
        setIsNight(nightNow);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NightModeContext.Provider value={{ isNight, toggleNight }}>
      {children}
    </NightModeContext.Provider>
  );
}

export function useNightMode() {
  const ctx = useContext(NightModeContext);
  if (!ctx) throw new Error("useNightMode must be used within NightModeProvider");
  return ctx;
}
