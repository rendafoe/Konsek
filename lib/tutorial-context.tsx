"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface TutorialContextType {
  isTutorialOpen: boolean;
  hasCompletedTutorial: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

const STORAGE_KEY = "konsek_tutorial_completed";

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true); // default true to prevent flash

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY) === "true";
    setHasCompletedTutorial(completed);
  }, []);

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);
  const closeTutorial = useCallback(() => setIsTutorialOpen(false), []);

  const completeTutorial = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasCompletedTutorial(true);
    setIsTutorialOpen(false);
  }, []);

  return (
    <TutorialContext.Provider
      value={{ isTutorialOpen, hasCompletedTutorial, openTutorial, closeTutorial, completeTutorial }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
