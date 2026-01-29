import { useCharacter, useCreateCharacter } from "@/hooks/use-character";
import { useStravaStatus, useStravaSync } from "@/hooks/use-strava";
import { useRuns } from "@/hooks/use-runs";
import { EskoCharacter } from "@/components/EskoCharacter";
import { Navigation } from "@/components/Navigation";
import { Loader2, RefreshCw, AlertTriangle, Activity, Sparkles, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: character, isLoading: isCharLoading } = useCharacter();
  const { data: stravaStatus, isLoading: isStravaLoading } = useStravaStatus();
  const { data: runs } = useRuns();
  const { mutate: createCharacter, isPending: isCreating } = useCreateCharacter();
  const { mutate: syncStrava, isPending: isSyncing } = useStravaSync();
  const { toast } = useToast();

  // Auto-create character named "Esko" when user has none
  useEffect(() => {
    if (!isCharLoading && !character && !isCreating) {
      createCharacter({ name: "Esko" }, {
        onSuccess: () => toast({ title: "Esko has arrived!", description: "Your companion is ready to run with you." })
      });
    }
  }, [isCharLoading, character, isCreating, createCharacter, toast]);

  const handleSync = () => {
    syncStrava(undefined, {
      onSuccess: (data) => toast({ title: "Sync Complete", description: data.message }),
      onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" })
    });
  };

  if (isCharLoading || isStravaLoading || (!character && isCreating)) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-white/80" />
          <p className="text-white/60 text-sm">Loading your companion...</p>
        </div>
      </div>
    );
  }

  // Calculate character age in days
  const calculateAge = () => {
    if (!character?.createdAt) return 0;
    const created = new Date(character.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Dashboard View
  return (
    <div className="min-h-screen aurora-bg flex flex-col md:flex-row">
      <Navigation />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header with Strava Profile and Sync */}
        <header className="bg-white/95 backdrop-blur-sm rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border-b-4 border-primary/20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Konsek</h1>
              <p className="text-sm text-muted-foreground">Running Companion</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
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

        {/* Strava Connection Warning */}
        {!stravaStatus?.isConnected && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={24} />
            <div>
              <span className="font-semibold text-amber-800">Connect Strava to get started</span>
              <p className="text-sm text-amber-700">Link your Strava account to sync your runs and keep Esko healthy.</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto grid gap-8">
          {/* Character Card with Stats on the Right */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
              {/* Esko Character Display - Larger */}
              <div className="flex-shrink-0">
                <EskoCharacter
                  totalRuns={character?.totalRuns || 0}
                  name="Esko"
                  healthPercent={Math.max(0, 100 - (character?.healthState ?? 0) * 25)}
                  isDead={character?.status === "dead"}
                  size="lg"
                />
              </div>

              {/* Stats Stacked Vertically */}
              <div className="flex flex-col gap-4 flex-1 justify-center min-w-[200px]">
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
                    <div className="text-2xl font-bold text-foreground">{calculateAge()} days</div>
                    <div className="text-sm text-muted-foreground">Age</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-primary/20 text-primary">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.round((character?.totalDistance || 0) / 1000)} km
                    </div>
                    <div className="text-sm text-muted-foreground">Total Distance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities Panel - Full Width */}
          <div className="section-panel">
            <h3 className="text-lg font-bold text-foreground mb-4">Recent Activities</h3>

            {runs && runs.length > 0 ? (
              <div className="space-y-3">
                {runs.slice(0, 5).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    data-testid={`activity-item-${run.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                      <Activity size={18} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">
                          {run.name || `${(run.distance / 1000).toFixed(1)} km Run`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(run.duration / 60)} min
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {(run.distance / 1000).toFixed(1)} km
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(run.date), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
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
      </main>
    </div>
  );
}
