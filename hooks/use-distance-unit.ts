"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "konsek_distance_unit";

function loadUnit(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "miles";
  } catch {}
  return true; // default to miles
}

export function useDistanceUnit() {
  const [useMiles, setUseMiles] = useState(true);

  useEffect(() => {
    setUseMiles(loadUnit());
  }, []);

  const toggleUnit = useCallback(() => {
    setUseMiles((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "miles" : "km");
      } catch {}
      return next;
    });
  }, []);

  const formatDistance = useCallback(
    (meters: number): string => {
      if (useMiles) return `${(meters / 1609.344).toFixed(2)} mi`;
      return `${(meters / 1000).toFixed(2)} km`;
    },
    [useMiles]
  );

  return { useMiles, toggleUnit, formatDistance };
}
