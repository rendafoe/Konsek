"use client";

import { useState, useEffect } from "react";

type TimeOfDay = "day" | "night";

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? "night" : "day";
  });

  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours();
      setTimeOfDay(hour >= 18 ? "night" : "day");
    };

    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return timeOfDay;
}
