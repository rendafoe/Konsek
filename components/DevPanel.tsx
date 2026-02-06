"use client";

// Dev Panel - Testing tool for development mode only
// Provides quick controls to test all app scenarios

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useCharacter } from "@/hooks/use-character";
import {
  Zap,
  Heart,
  RotateCcw,
  Crown,
  Gift,
  Play,
  X,
  Calendar,
  Skull,
} from "lucide-react";

// Stage thresholds matching EskoCharacter.tsx
const STAGES = [
  { name: "Egg", runs: 0, key: "egg" },
  { name: "Hatchling V1", runs: 1, key: "hatchling-v1" },
  { name: "Hatchling V2", runs: 2, key: "hatchling-v2" },
  { name: "Child", runs: 3, key: "child" },
  { name: "Adolescent", runs: 7, key: "adolescent" },
  { name: "Young Adult", runs: 11, key: "young-adult" },
  { name: "Mature", runs: 20, key: "mature" },
  { name: "Maxed", runs: 30, key: "maxed" },
] as const;

const HEALTH_STATES = [
  { label: "100%", value: 0, color: "bg-green-500" },
  { label: "75%", value: 1, color: "bg-lime-500" },
  { label: "50%", value: 2, color: "bg-amber-500" },
  { label: "25%", value: 3, color: "bg-orange-500" },
];

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-200 hover:bg-gray-300",
  uncommon: "bg-green-200 hover:bg-green-300",
  rare: "bg-blue-200 hover:bg-blue-300",
  epic: "bg-purple-200 hover:bg-purple-300",
  legendary: "bg-yellow-200 hover:bg-yellow-300",
};

interface DevPanelProps {
  onRunSimulated?: (data: {
    awardedItems: any[];
    medalsAwarded: number;
    progressionReward?: { stage: string; medalsAwarded: number } | null;
  }) => void;
}

export function DevPanel({ onRunSimulated }: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: character } = useCharacter();

  // Keyboard shortcut: Ctrl+D to toggle panel
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Invalidate all relevant queries after dev actions
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: [api.character.get.path] });
    queryClient.invalidateQueries({ queryKey: [api.character.archive.path] });
    queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    queryClient.invalidateQueries({ queryKey: ["/api/medals/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
  };

  // API helper
  const devFetch = async (
    endpoint: string,
    method: "POST" | "DELETE" = "POST",
    body?: object
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // Set character state
  const setCharacterState = async (updates: {
    totalRuns?: number;
    healthState?: number;
    daysAlive?: number;
    medalBalance?: number;
  }) => {
    try {
      await devFetch("/api/dev/set-character-state", "POST", updates);
      invalidateAll();
      toast({ title: "Character Updated", description: "State changed successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Jump to stage
  const jumpToStage = (runs: number) => {
    setCharacterState({ totalRuns: runs });
  };

  // Set health state (except Dead - that uses kill-character)
  const setHealth = (healthState: number) => {
    setCharacterState({ healthState });
  };

  // Kill character (proper archiving)
  const killCharacter = async () => {
    if (!window.confirm("This will archive your character as dead. Continue?")) return;
    try {
      await devFetch("/api/dev/kill-character", "POST");
      invalidateAll();
      toast({
        title: "Character Archived",
        description: "Your companion has passed. You can create a new one.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Simulate run - now triggers reward modal
  const simulateRun = async (distanceKm: number) => {
    try {
      const data = await devFetch("/api/dev/simulate-run", "POST", {
        distanceKm,
        triggerRewards: true,
      });
      invalidateAll();

      // Trigger the reward modal in Dashboard if items/medals/progression were awarded
      if (onRunSimulated && (data.awardedItems?.length > 0 || data.medalsAwarded > 0 || data.progressionReward)) {
        onRunSimulated({
          awardedItems: data.awardedItems || [],
          medalsAwarded: data.medalsAwarded || 0,
          progressionReward: data.progressionReward,
        });
      }

      // Show health-related toast
      if (data.healthImproved) {
        toast({
          title: "Health Improved!",
          description: `Health: ${data.healthPercent}% (+25% from run)`,
        });
      } else if (!data.isFirstRunOfDay && data.healthPercent !== undefined) {
        toast({
          title: "Run Logged",
          description: `Health unchanged (already ran today): ${data.healthPercent}%`,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Simulate day passing
  const simulateDay = async () => {
    try {
      const data = await devFetch("/api/dev/simulate-day", "POST");
      invalidateAll();

      // Show appropriate toast based on what happened
      if (data.isDead) {
        toast({
          title: "Esko Has Died",
          description: "Your companion passed from neglect. Start a new journey.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Day Passed",
          description: data.healthPercent !== undefined
            ? `Health: ${data.healthPercent}% (no run yesterday)`
            : data.message,
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Award items
  const awardItems = async (rarity: string) => {
    try {
      const data = await devFetch("/api/dev/award-items", "POST", { rarity, count: 1 });
      invalidateAll();
      toast({
        title: "Item Awarded",
        description: data.awardedItems?.[0]?.name || `${rarity} item added`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Reset user
  const resetUser = async () => {
    if (!window.confirm("This will delete ALL user data. Continue?")) return;
    try {
      await devFetch("/api/dev/reset-user", "DELETE");
      invalidateAll();
      toast({ title: "Reset Complete", description: "All user data cleared" });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Max everything
  const maxEverything = async () => {
    try {
      await devFetch("/api/dev/max-everything", "POST");
      invalidateAll();
      toast({ title: "Maxed!", description: "Maxed stage, full health, 500 medals" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Clear runs
  const clearRuns = async () => {
    try {
      await devFetch("/api/dev/clear-runs", "DELETE");
      invalidateAll();
      toast({ title: "All Cleared", description: "Runs, items, achievements, check-ins, medals reset" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Get current stage for highlighting
  const getCurrentStageIndex = () => {
    const runs = character?.totalRuns || 0;
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (runs >= STAGES[i].runs) return i;
    }
    return 0;
  };

  const currentStageIndex = getCurrentStageIndex();
  const currentHealthState = character?.healthState ?? 0;
  const isDead = character?.status === "dead" || currentHealthState >= 4;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute bottom-0 right-0 w-12 h-12 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center"
        title="Dev Panel (Ctrl+D)"
      >
        {isOpen ? <X size={20} /> : <Zap size={20} />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-xl shadow-2xl border-2 border-violet-200 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* Header */}
          <div className="bg-violet-600 text-white px-4 py-2 flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-2">
              <Zap size={16} /> Dev Panel
            </span>
            <span className="text-xs opacity-75">Ctrl+D to toggle</span>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Current State Display */}
            <div className="text-xs bg-slate-100 rounded-lg p-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-medium ${isDead ? "text-red-600" : "text-green-600"}`}>
                  {isDead ? "Dead" : "Alive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stage:</span>
                <span className="font-medium">{STAGES[currentStageIndex].name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Runs:</span>
                <span className="font-medium">{character?.totalRuns ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Days Alive:</span>
                <span className="font-medium">{character?.daysAlive ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Health:</span>
                <span className="font-medium">
                  {isDead ? "Dead" : HEALTH_STATES[currentHealthState]?.label || "100%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medals:</span>
                <span className="font-medium">{character?.medalBalance ?? 0}</span>
              </div>
            </div>

            {/* Section: Esko Stage */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Crown size={12} /> Stage Quick-Jump
              </h4>
              <div className="flex flex-wrap gap-1">
                {STAGES.map((stage, idx) => (
                  <button
                    key={stage.key}
                    onClick={() => jumpToStage(stage.runs)}
                    disabled={isLoading || isDead}
                    className={`px-2 py-1 text-[10px] rounded-md border transition-all ${
                      idx === currentStageIndex
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white hover:bg-violet-50 border-slate-200"
                    } disabled:opacity-50`}
                    title={`${stage.runs} runs`}
                  >
                    {stage.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Health State */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Heart size={12} /> Health State
              </h4>
              <div className="flex gap-1">
                {HEALTH_STATES.map((state) => (
                  <button
                    key={state.value}
                    onClick={() => setHealth(state.value)}
                    disabled={isLoading || isDead}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-md border transition-all ${
                      state.value === currentHealthState && !isDead
                        ? `${state.color} text-white border-transparent`
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    } disabled:opacity-50`}
                  >
                    {state.label}
                  </button>
                ))}
                <button
                  onClick={killCharacter}
                  disabled={isLoading || isDead}
                  className={`flex-1 px-2 py-1.5 text-[10px] rounded-md border transition-all ${
                    isDead
                      ? "bg-red-500 text-white border-transparent"
                      : "bg-white hover:bg-red-50 border-slate-200 text-red-600"
                  } disabled:opacity-50`}
                >
                  <Skull size={10} className="inline mr-0.5" />
                  Dead
                </button>
              </div>
            </div>

            {/* Section: Quick Actions */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Play size={12} /> Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateRun(5)}
                  disabled={isLoading || isDead}
                  className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-all disabled:opacity-50"
                >
                  + Run (5km)
                </button>
                <button
                  onClick={() => simulateRun(10)}
                  disabled={isLoading || isDead}
                  className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 rounded-lg transition-all disabled:opacity-50"
                >
                  + Run (10km)
                </button>
                <button
                  onClick={() => simulateRun(25)}
                  disabled={isLoading || isDead}
                  className="px-3 py-2 text-xs bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-all disabled:opacity-50"
                >
                  + Run (25km)
                </button>
                <button
                  onClick={maxEverything}
                  disabled={isLoading || isDead}
                  className="px-3 py-2 text-xs bg-amber-100 hover:bg-amber-200 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Crown size={12} /> Max All
                </button>
              </div>
            </div>

            {/* Section: Time Control */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Calendar size={12} /> Time Control
              </h4>
              <button
                onClick={simulateDay}
                disabled={isLoading}
                className="w-full px-3 py-2 text-xs bg-teal-100 hover:bg-teal-200 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Calendar size={12} /> Simulate Day Passing
              </button>
              <p className="text-[10px] text-slate-500 mt-1">
                Skips a day: health decays 25%, check-in resets
              </p>
            </div>

            {/* Section: Award Items */}
            <div>
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <Gift size={12} /> Award Item
              </h4>
              <div className="flex flex-wrap gap-1">
                {RARITIES.map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => awardItems(rarity)}
                    disabled={isLoading}
                    className={`px-2 py-1 text-[10px] rounded-md transition-all capitalize disabled:opacity-50 ${RARITY_COLORS[rarity]}`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Reset */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <RotateCcw size={12} /> Reset
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={clearRuns}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-all disabled:opacity-50"
                >
                  Clear All
                </button>
                <button
                  onClick={resetUser}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  Full Reset
                </button>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
