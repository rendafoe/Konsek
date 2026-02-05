import { useCharacter, useCreateCharacter } from "@/hooks/use-character";
import { useStravaStatus, useStravaSync } from "@/hooks/use-strava";
import { useActivities } from "@/hooks/use-activities";
import { useMedalStatus } from "@/hooks/use-medals";
import { EskoCharacter } from "@/components/EskoCharacter";
import { Navigation } from "@/components/Navigation";
import { ItemRewardModal } from "@/components/ItemRewardModal";
import { DailyCheckInBox } from "@/components/DailyCheckInBox";
import { MiniRouteMap } from "@/components/MiniRouteMap";
import { DevPanel } from "@/components/DevPanel";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Activity, Sparkles, Calendar, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";

const rarityBadgeStyles: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-green-100 text-green-700 border-green-300",
  rare: "bg-blue-100 text-blue-700 border-blue-300",
  epic: "bg-purple-100 text-purple-700 border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-400",
  mythic: "bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 text-purple-700 border-purple-300",
};

// Medal rewards per item rarity
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

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export default function Dashboard() {
  const { data: character, isLoading: isCharLoading } = useCharacter();
  const { data: stravaStatus, isLoading: isStravaLoading } = useStravaStatus();
  const { data: activitiesData } = useActivities({ page: 1, limit: 5 });
  const { data: medalStatus } = useMedalStatus();
  const { mutate: createCharacter, isPending: isCreating } = useCreateCharacter();
  const { mutate: syncStrava, isPending: isSyncing } = useStravaSync();
  const { toast } = useToast();

  // State for distance unit toggle
  const [useMiles, setUseMiles] = useState(false);

  // State for item reward modal
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [awardedItems, setAwardedItems] = useState<any[]>([]);
  const [medalsFromSync, setMedalsFromSync] = useState<number>(0);
  const [progressionReward, setProgressionReward] = useState<{ stage: string; medalsAwarded: number } | null>(null);

  // State to hold previous runs count - used to delay stage progression visually until modal is dismissed
  const [frozenTotalRuns, setFrozenTotalRuns] = useState<number | null>(null);

  const activities = activitiesData?.activities || [];

  // Check if character is dead
  const isCharacterDead = character?.status === "dead";

  // Auto-create character named "Esko" when user has none (but NOT if we just don't have one yet during loading)
  // Don't auto-create - let the user click to create
  // useEffect removed - we'll show a button instead

  // Handler for DevPanel run simulation - shows the same reward modal
  const handleDevRunSimulated = useCallback((data: {
    awardedItems: any[];
    medalsAwarded: number;
    progressionReward?: { stage: string; medalsAwarded: number } | null;
  }) => {
    if (data.awardedItems.length > 0 || data.medalsAwarded > 0 || data.progressionReward) {
      // Freeze the current stage while showing rewards
      if (character) {
        setFrozenTotalRuns(character.totalRuns || 0);
      }
      setAwardedItems(data.awardedItems);
      setMedalsFromSync(data.medalsAwarded);
      setProgressionReward(data.progressionReward || null);
      setRewardModalOpen(true);
    }
  }, [character]);

  // Handler to create a new character
  const handleCreateCharacter = () => {
    createCharacter({ name: "Esko" }, {
      onSuccess: () => toast({ title: "Esko has arrived!", description: "Your companion is ready to run with you." })
    });
  };

  const handleSync = () => {
    // Capture current runs before sync for stage freeze
    const runsBeforeSync = character?.totalRuns || 0;

    syncStrava(undefined, {
      onSuccess: (data) => {
        toast({ title: "Sync Complete", description: data.message });
        // Show item reward modal if items were awarded, medals earned, or progression happened
        if ((data.awardedItems && data.awardedItems.length > 0) || data.medalsAwarded || data.progressionReward) {
          // Freeze the stage at the pre-sync state while showing rewards
          setFrozenTotalRuns(runsBeforeSync);
          setAwardedItems(data.awardedItems || []);
          setMedalsFromSync(data.medalsAwarded || 0);
          setProgressionReward(data.progressionReward || null);
          setRewardModalOpen(true);
        }
      },
      onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" })
    });
  };

  if (isCharLoading || isStravaLoading || isCreating) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-white/80" />
          <p className="text-white/60 text-sm">Loading your companion...</p>
        </div>
      </div>
    );
  }

  // Show create character screen if no character exists
  if (!character) {
    return (
      <div className="min-h-screen aurora-bg flex flex-col md:flex-row">
        <Navigation />
        <main className="flex-1 p-6 md:p-10 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md text-center">
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
          {import.meta.env.DEV && <DevPanel onRunSimulated={handleDevRunSimulated} />}
        </main>
      </div>
    );
  }

  // Get character age (days with at least one run synced)
  const getAge = () => {
    return character?.daysAlive || 0;
  };

  // Format total distance based on unit preference
  const getTotalDistance = () => {
    const meters = character?.totalDistance || 0;
    if (useMiles) {
      return `${(meters / 1609.344).toFixed(1)} mi`;
    }
    return `${Math.round(meters / 1000)} km`;
  };

  // Dashboard View
  return (
    <div className="min-h-screen aurora-bg flex flex-col md:flex-row">
      <Navigation />

      {/* Item Reward Modal */}
      <ItemRewardModal
        items={awardedItems}
        medalsAwarded={medalsFromSync}
        progressionReward={progressionReward}
        open={rewardModalOpen}
        onOpenChange={(open) => {
          setRewardModalOpen(open);
          // When modal closes, unfreeze the stage and clear progression reward
          if (!open) {
            setFrozenTotalRuns(null);
            setProgressionReward(null);
          }
        }}
      />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header with Strava Profile, Medal Count, and Sync */}
        <header className="bg-white/95 backdrop-blur-sm rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border-b-4 border-primary/20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Konsek</h1>
              <p className="text-sm text-muted-foreground">Running Companion</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            {/* Medal Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <img src="/items/medal.png" alt="Medals" className="w-5 h-5" />
              <span className="font-bold text-yellow-700">{medalStatus?.balance ?? 0}</span>
            </div>

            {/* Strava Profile Display */}
            {stravaStatus?.isConnected && stravaStatus.athleteName && (
              <div className="flex items-center gap-3">
                {stravaStatus.athleteProfilePicture && (
                  <img
                    src={stravaStatus.athleteProfilePicture}
                    alt={stravaStatus.athleteName}
                    className="w-10 h-10 rounded-full border-2 border-primary/30"
                  />
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-foreground">{stravaStatus.athleteName}</div>
                  {stravaStatus.lastSync && (
                    <div className="text-xs text-muted-foreground">
                      Synced {format(new Date(stravaStatus.lastSync), "MMM d, h:mm a")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sync Button or Connect Button */}
            {stravaStatus?.isConnected ? (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                data-testid="button-sync-strava"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
            ) : (
              <a
                href="/api/strava/connect"
                className="flex items-center gap-2 px-4 py-2 strava-btn rounded-xl font-semibold text-sm"
                data-testid="link-connect-strava"
              >
                <Activity size={16} /> Connect Strava
              </a>
            )}
          </div>
        </header>

        {/* Character Death Banner */}
        {isCharacterDead && (
          <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <img src="/esko/esko-egg.png" alt="New Esko" className="w-16 h-16 opacity-50" />
              <div className="flex-1 text-center md:text-left">
                <span className="font-semibold text-slate-700 text-lg">Your companion has passed into legend</span>
                <p className="text-sm text-slate-600 mt-1">
                  Esko lived for {character?.daysAlive || 0} days and completed {character?.totalRuns || 0} runs.
                  Start a new journey with a fresh companion.
                </p>
              </div>
              <button
                onClick={handleCreateCharacter}
                disabled={isCreating}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Heart size={18} /> Start New Companion
              </button>
            </div>
          </div>
        )}


        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto grid gap-8">
          {/* Daily Check-In Box - Only show if alive */}
          {stravaStatus?.isConnected && !isCharacterDead && <DailyCheckInBox />}

          {/* Character Card - Esko as Hero */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
            {/* Esko Character Display - Prominent Hero */}
            <div className="flex justify-center mb-6">
              <EskoCharacter
                totalRuns={frozenTotalRuns !== null ? frozenTotalRuns : (character?.totalRuns || 0)}
                name="Esko"
                healthPercent={Math.max(0, 100 - (character?.healthState ?? 0) * 25)}
                isDead={character?.status === "dead"}
                size="xl"
              />
            </div>

            {/* Stats in Horizontal Row Below */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-card">
                <div className="stat-icon bg-primary/20 text-primary">
                  <Activity size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{character?.totalRuns || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Runs</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-secondary/20 text-secondary">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{getAge()} days</div>
                  <div className="text-sm text-muted-foreground">Age</div>
                </div>
              </div>

              {/* Clickable Distance Card - Toggles miles/km */}
              <div
                className="stat-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setUseMiles(!useMiles)}
                title="Click to toggle miles/km"
              >
                <div className="stat-icon bg-primary/20 text-primary">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {getTotalDistance()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Distance <span className="text-xs">(click to toggle)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities Table - Matching Log Tab Format */}
          <div className="section-panel">
            <h3 className="text-lg font-bold text-foreground mb-4">Recent Activities</h3>

            {activities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[120px]">Title</TableHead>
                      <TableHead className="min-w-[80px]">Duration</TableHead>
                      <TableHead className="min-w-[80px]">Distance</TableHead>
                      <TableHead className="min-w-[70px]">Route</TableHead>
                      <TableHead className="min-w-[120px]">Rewards</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">
                          {format(new Date(activity.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {activity.name || "Run"}
                        </TableCell>
                        <TableCell>{formatDuration(activity.duration)}</TableCell>
                        <TableCell>{formatDistance(activity.distance)}</TableCell>
                        <TableCell>
                          <MiniRouteMap
                            polyline={activity.polyline}
                            width={60}
                            height={40}
                          />
                        </TableCell>
                        <TableCell>
                          {activity.awardedItems && activity.awardedItems.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap gap-1">
                                {activity.awardedItems.map((ri: any, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0.5 ${
                                      ri.item ? rarityBadgeStyles[ri.item.rarity] : ""
                                    }`}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    {ri.item?.name || "Item"}
                                  </Badge>
                                ))}
                              </div>
                              {/* Medal count */}
                              {calculateMedalsFromItems(activity.awardedItems) > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-yellow-700">
                                  <img src="/items/medal.png" alt="" className="w-3 h-3" />
                                  +{calculateMedalsFromItems(activity.awardedItems)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No activities logged yet. Connect Strava and sync your runs to keep Esko healthy!
              </p>
            )}
          </div>
        </div>

        {/* Dev Panel - Only in development mode */}
        {import.meta.env.DEV && <DevPanel onRunSimulated={handleDevRunSimulated} />}
      </main>
    </div>
  );
}
