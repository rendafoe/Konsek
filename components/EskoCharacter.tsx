"use client";

// Esko - The app mascot character
// Progresses through 8 stages based on total runs synced

import { cn } from "@/lib/utils";

export type EskoStage =
  | "egg"
  | "hatchling-v1"
  | "hatchling-v2"
  | "child"
  | "adolescent"
  | "young-adult"
  | "mature"
  | "maxed";

export interface EskoStageInfo {
  stage: EskoStage;
  name: string;
  displayName: string;
  runsRequired: number;
  nextStageRuns: number | null;
}

// Stage progression thresholds
const STAGE_THRESHOLDS: { stage: EskoStage; name: string; runs: number }[] = [
  { stage: "egg", name: "Egg", runs: 0 },
  { stage: "hatchling-v1", name: "Hatchling", runs: 1 },
  { stage: "hatchling-v2", name: "Baby", runs: 2 },
  { stage: "child", name: "Child", runs: 3 },
  { stage: "adolescent", name: "Adolescent", runs: 7 },
  { stage: "young-adult", name: "Young Adult", runs: 11 },
  { stage: "mature", name: "Mature", runs: 20 },
  { stage: "maxed", name: "Maxed", runs: 30 },
];

/**
 * Calculate Esko's current stage based on total runs
 */
export function getEskoStage(totalRuns: number): EskoStageInfo {
  let currentStage = STAGE_THRESHOLDS[0];
  let nextStageRuns: number | null = STAGE_THRESHOLDS[1]?.runs ?? null;

  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalRuns >= STAGE_THRESHOLDS[i].runs) {
      currentStage = STAGE_THRESHOLDS[i];
      nextStageRuns = STAGE_THRESHOLDS[i + 1]?.runs ?? null;
      break;
    }
  }

  return {
    stage: currentStage.stage,
    name: currentStage.name,
    displayName: `Esko - ${currentStage.name}`,
    runsRequired: currentStage.runs,
    nextStageRuns,
  };
}

/**
 * Get progress percentage to next stage
 */
export function getStageProgress(totalRuns: number): number {
  const stageInfo = getEskoStage(totalRuns);

  if (stageInfo.nextStageRuns === null) {
    return 100; // Maxed out
  }

  const runsInCurrentStage = totalRuns - stageInfo.runsRequired;
  const runsNeededForNext = stageInfo.nextStageRuns - stageInfo.runsRequired;

  return Math.min(100, Math.round((runsInCurrentStage / runsNeededForNext) * 100));
}

// Stage colors for visual distinction
const STAGE_COLORS: Record<EskoStage, { bg: string; text: string; border: string }> = {
  "egg": { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300" },
  "hatchling-v1": { bg: "bg-lime-100", text: "text-lime-700", border: "border-lime-300" },
  "hatchling-v2": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  "child": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300" },
  "adolescent": { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-300" },
  "young-adult": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  "mature": { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300" },
  "maxed": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-400" },
};

// Image paths for each stage
const STAGE_IMAGES: Record<EskoStage, string> = {
  "egg": "/esko/esko-egg.png",
  "hatchling-v1": "/esko/esko-hatchling-v1.png",
  "hatchling-v2": "/esko/esko-hatchling-v2.png",
  "child": "/esko/esko-child.png",
  "adolescent": "/esko/esko-adolescent.png",
  "young-adult": "/esko/esko-young-adult.png",
  "mature": "/esko/esko-mature.png",
  "maxed": "/esko/esko-maxed.png",
};

// Animation classes for each stage
const STAGE_ANIMATIONS: Record<EskoStage, string> = {
  "egg": "animate-esko-egg",
  "hatchling-v1": "animate-esko-hatchling-v1",
  "hatchling-v2": "animate-esko-hatchling-v2",
  "child": "animate-esko-child",
  "adolescent": "animate-esko-adolescent",
  "young-adult": "animate-esko-young-adult",
  "mature": "animate-esko-mature",
  "maxed": "animate-esko-maxed",
};

interface EskoCharacterProps {
  totalRuns: number;
  name?: string;
  showHealthBar?: boolean;
  healthPercent?: number;
  isDead?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function EskoCharacter({
  totalRuns,
  name = "Esko",
  showHealthBar = true,
  healthPercent = 100,
  isDead = false,
  size = "md",
}: EskoCharacterProps) {
  const stageInfo = getEskoStage(totalRuns);
  const colors = STAGE_COLORS[stageInfo.stage];

  const sizeClasses = {
    sm: "w-24 h-24 text-xs",
    md: "w-40 h-40 text-sm",
    lg: "w-56 h-56 text-base",
    xl: "w-72 h-72 text-lg",
    "2xl": "w-96 h-96 text-xl",
  };

  // Determine health state class for animation modifiers
  const getHealthStateClass = () => {
    if (isDead) return "";
    if (healthPercent <= 25) return "health-critical";
    if (healthPercent <= 50) return "health-low";
    return "";
  };

  const healthBarColor = healthPercent > 70
    ? "bg-green-500"
    : healthPercent > 30
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="device-screen mx-auto" data-testid="esko-device-screen">
      <div className="device-screen-inner">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-current/20">
          <span className="font-bold text-sm text-foreground" data-testid="character-name">
            {name}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}
            data-testid="character-stage"
          >
            {stageInfo.name}
          </span>
        </div>

        {/* Esko Character Image */}
        <div className={cn("flex justify-center items-center min-h-[180px] mb-4", getHealthStateClass())}>
          <div className="flex flex-col items-center">
            <img
              src={STAGE_IMAGES[stageInfo.stage]}
              alt={`Esko - ${stageInfo.name}`}
              className={cn(
                sizeClasses[size],
                "object-contain",
                !isDead && STAGE_ANIMATIONS[stageInfo.stage],
                isDead && "esko-dead"
              )}
              data-testid="esko-character-image"
            />
            <div className="mt-2 text-center">
              <div className="font-pixel text-sm text-foreground/80">{stageInfo.name}</div>
              <div className="text-[10px] text-foreground/60">
                {stageInfo.nextStageRuns
                  ? `${stageInfo.nextStageRuns - totalRuns} runs to next stage`
                  : "Max stage reached!"}
              </div>
            </div>
          </div>
        </div>

        {/* Health Bar */}
        {showHealthBar && (
          <div className="mb-3">
            <div className="text-xs font-bold text-center mb-2 text-foreground/70">Health</div>
            <div className="h-4 bg-muted rounded-full overflow-hidden border-2 border-border">
              <div
                className={`h-full ${healthBarColor} transition-all`}
                style={{ width: `${healthPercent}%` }}
                data-testid="health-bar-fill"
              />
            </div>
            <div className="text-sm font-bold text-center mt-1 text-foreground" data-testid="health-percent">
              {healthPercent}%
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {isDead && (
          <div className="text-center text-xs font-bold p-2 rounded-lg mt-3 bg-destructive/20 text-destructive">
            Your companion has passed into legend.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple preview version for landing page
 */
export function EskoPreview({
  stage = "child",
  size = "md"
}: {
  stage?: EskoStage;
  size?: "sm" | "md" | "lg";
}) {
  const stageInfo = STAGE_THRESHOLDS.find(s => s.stage === stage) || STAGE_THRESHOLDS[0];

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className="flex flex-col items-center">
      <img
        src={STAGE_IMAGES[stage]}
        alt={`Esko - ${stageInfo.name}`}
        className={cn(
          sizeClasses[size],
          "object-contain",
          STAGE_ANIMATIONS[stage]
        )}
      />
      <div className="font-pixel text-xs mt-1">{stageInfo.name}</div>
    </div>
  );
}
