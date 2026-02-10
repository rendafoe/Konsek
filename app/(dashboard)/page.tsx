"use client";

import { useCharacter, useCreateCharacter } from "@/hooks/use-character";
import { useStravaStatus } from "@/hooks/use-strava";
import { useActivities } from "@/hooks/use-activities";
import { useMedalStatus } from "@/hooks/use-medals";
import { useClaimReferral } from "@/hooks/use-referrals";
import { useSyncContext } from "@/lib/sync-context";
import { EskoCharacter } from "@/components/EskoCharacter";
import { ItemRewardModal } from "@/components/ItemRewardModal";
import { DailyCheckInBox } from "@/components/DailyCheckInBox";
import { MiniRouteMap } from "@/components/MiniRouteMap";
import { DevPanel } from "@/components/DevPanel";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Sparkles, Calendar, Heart, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import Link from "next/link";

const rarityBadgeStyles: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-green-100 text-green-700 border-green-300",
  rare: "bg-blue-100 text-blue-700 border-blue-300",
  epic: "bg-purple-100 text-purple-700 border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-400",
  mythic: "bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 text-purple-700 border-purple-300",
};

const rarityMedalRewards: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 5,
  legendary: 8,
  mythic: 0,
};

function calculateMedalsFromItems(items: Array<{ item?: { rarity: string } }>): number {
  return items.reduce((total, ri) => {
    if (ri.item) {
      return total + (rarityMedalRewards[ri.item.rarity] || 0);
    }
    return total;
  }, 0);
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export default function Dashboard() {
  const { data: character, isLoading: isCharLoading } = useCharacter();
  const { data: stravaStatus, isLoading: isStravaLoading } = useStravaStatus();
  const { data: activitiesData } = useActivities({ page: 1, limit: 2 });
  const { mutate: createCharacter, isPending: isCreating } = useCreateCharacter();
  const { mutate: claimReferral } = useClaimReferral();
  const { registerSyncHandler } = useSyncContext();
  const { toast } = useToast();

  const [useMiles, setUseMiles] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [awardedItems, setAwardedItems] = useState<any[]>([]);
  const [medalsFromSync, setMedalsFromSync] = useState<number>(0);
  const [progressionReward, setProgressionReward] = useState<{ stage: string; medalsAwarded: number } | null>(null);
  const [frozenTotalRuns, setFrozenTotalRuns] = useState<number | null>(null);
  const [showEvolutionAnimation, setShowEvolutionAnimation] = useState(false);
  const hadProgressionRef = useRef(false);

  const activities = activitiesData?.activities || [];
  const isCharacterDead = character?.status === "dead";
  const isDev = process.env.NODE_ENV === "development";

  // Register sync handler for reward modals
  useEffect(() => {
    const runsBeforeSync = character?.totalRuns || 0;
    const unregister = registerSyncHandler((data) => {
      toast({ title: "Sync Complete", description: data.message });
      if ((data.awardedItems && data.awardedItems.length > 0) || data.medalsAwarded || data.progressionReward) {
        setFrozenTotalRuns(runsBeforeSync);
        setAwardedItems(data.awardedItems || []);
        setMedalsFromSync(data.medalsAwarded || 0);
        setProgressionReward(data.progressionReward || null);
        hadProgressionRef.current = !!data.progressionReward;
        setRewardModalOpen(true);
      }
    });
    return unregister;
  }, [registerSyncHandler, character?.totalRuns, toast]);

  // Auto-claim referral from localStorage
  useEffect(() => {
    if (!character || character.status !== "alive") return;
    const code = localStorage.getItem("konsek_referral_code");
    if (!code) return;
    localStorage.removeItem("konsek_referral_code");
    claimReferral(code, {
      onSuccess: (data) => {
        toast({
          title: "Welcome Bonus!",
          description: `You were referred by ${data.referrerName}! You earned ${data.welcomeBonus} medals.`,
        });
      },
      onError: () => {
        // Silently ignore — already claimed or invalid
      },
    });
  }, [character, claimReferral, toast]);

  const handleDevRunSimulated = useCallback((data: {
    awardedItems: any[];
    medalsAwarded: number;
    progressionReward?: { stage: string; medalsAwarded: number } | null;
  }) => {
    if (data.awardedItems.length > 0 || data.medalsAwarded > 0 || data.progressionReward) {
      if (character) {
        setFrozenTotalRuns(character.totalRuns || 0);
      }
      setAwardedItems(data.awardedItems);
      setMedalsFromSync(data.medalsAwarded);
      setProgressionReward(data.progressionReward || null);
      hadProgressionRef.current = !!data.progressionReward;
      setRewardModalOpen(true);
    }
  }, [character]);

  const handleCreateCharacter = () => {
    createCharacter({ name: "Esko" }, {
      onSuccess: () => toast({ title: "Esko has arrived!", description: "Your companion is ready to run with you." })
    });
  };

  if (isCharLoading || isStravaLoading || isCreating) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-white/80" />
          <p className="text-white/60 text-sm">Loading your companion...</p>
        </div>
      </main>
    );
  }

  if (!character) {
    return (
      <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <div className="bg-white/95 dark:bg-card backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md text-center">
          <img src="/esko/esko-egg.png" alt="Esko Egg" className="w-32 h-32 mx-auto mb-4 animate-esko-egg" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Konsek!</h2>
          <p className="text-muted-foreground mb-6">
            Start your running journey with Esko, your virtual companion who grows with every run you complete.
          </p>
          <button
            onClick={handleCreateCharacter}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <Heart size={20} /> Hatch Your Esko
          </button>
        </div>
        {isDev && <DevPanel onRunSimulated={handleDevRunSimulated} />}
      </main>
    );
  }

  const getAge = () => character?.daysAlive || 0;
  const getTotalDistance = () => {
    const meters = character?.totalDistance || 0;
    if (useMiles) return `${(meters / 1609.344).toFixed(1)} mi`;
    return `${Math.round(meters / 1000)} km`;
  };

  return (
    <>
      <ItemRewardModal
        items={awardedItems}
        medalsAwarded={medalsFromSync}
        progressionReward={progressionReward}
        open={rewardModalOpen}
        onOpenChange={(open) => {
          setRewardModalOpen(open);
          if (!open) {
            const hadProgression = hadProgressionRef.current;
            setFrozenTotalRuns(null);
            setProgressionReward(null);
            hadProgressionRef.current = false;
            if (hadProgression) {
              setShowEvolutionAnimation(true);
              setTimeout(() => setShowEvolutionAnimation(false), 1500);
            }
          }
        }}
      />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Dead State Banner */}
          {isCharacterDead && (
            <div className="cozy-card p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img src="/esko/esko-egg.png" alt="New Esko" className="w-12 h-12 opacity-50" />
                <div className="flex-1 text-center sm:text-left">
                  <span className="font-semibold text-foreground">Your companion has passed into legend</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Esko lived for {character?.daysAlive || 0} days and completed {character?.totalRuns || 0} runs.
                  </p>
                </div>
                <button
                  onClick={handleCreateCharacter}
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Heart size={16} /> New Companion
                </button>
              </div>
            </div>
          )}

          {/* Daily Check-In (outside hero zone) */}
          {stravaStatus?.isConnected && !isCharacterDead && (
            <DailyCheckInBox variant="cozy" />
          )}

          {/* Hero Zone */}
          <div className="esko-hero-zone esko-forest-backdrop p-5 md:p-6">
            {/* Esko Character */}
            <div className={`relative flex justify-center py-2 transition-all duration-700 ${showEvolutionAnimation ? "scale-110" : ""}`}>
              {showEvolutionAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-48 h-48 rounded-full bg-yellow-300/30 animate-ping" />
                </div>
              )}
              <EskoCharacter
                totalRuns={frozenTotalRuns !== null ? frozenTotalRuns : (character?.totalRuns || 0)}
                name="Esko"
                healthPercent={Math.max(0, 100 - (character?.healthState ?? 0) * 25)}
                isDead={character?.status === "dead"}
                size="lg"
                variant="hero"
              />
            </div>

            {/* Stat Pills */}
            <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-white/10 rounded-full text-sm">
                <Activity size={14} className="text-primary" />
                <span className="font-semibold">{character?.totalRuns || 0}</span>
                <span className="text-muted-foreground text-xs">runs</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-white/10 rounded-full text-sm">
                <Calendar size={14} className="text-secondary" />
                <span className="font-semibold">{getAge()}</span>
                <span className="text-muted-foreground text-xs">days</span>
              </div>

              <div
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 dark:bg-white/10 rounded-full text-sm cursor-pointer hover:bg-white/80 dark:hover:bg-white/15 transition-colors"
                onClick={() => setUseMiles(!useMiles)}
                title="Click to toggle"
              >
                <Sparkles size={14} className="text-primary" />
                <span className="font-semibold">{getTotalDistance()}</span>
              </div>
            </div>
          </div>

          {/* Recent Runs */}
          <div className="cozy-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Recent Runs</h3>
              {activities.length > 0 && (
                <Link
                  href="/activities"
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.slice(0, 2).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Route Map */}
                    <div className="shrink-0">
                      <MiniRouteMap polyline={activity.polyline} width={44} height={32} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {activity.name || "Run"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), "MMM d")} · {formatDuration(activity.duration)} · {formatDistance(activity.distance)}
                      </div>
                    </div>

                    {/* Rewards */}
                    {activity.awardedItems && activity.awardedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 shrink-0">
                        {activity.awardedItems.slice(0, 2).map((ri: any, idx: number) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${ri.item ? rarityBadgeStyles[ri.item.rarity] : ""}`}
                          >
                            {ri.item?.name || "Item"}
                          </Badge>
                        ))}
                        {activity.awardedItems.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{activity.awardedItems.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No activities logged yet. Connect Strava and sync your runs to keep Esko healthy!
              </p>
            )}
          </div>
        </div>

        {isDev && <DevPanel onRunSimulated={handleDevRunSimulated} />}
      </main>
    </>
  );
}
