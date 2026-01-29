import { useCharacter, useCreateCharacter } from "@/hooks/use-character";
import { useStravaStatus, useStravaSync } from "@/hooks/use-strava";
import { useRuns } from "@/hooks/use-runs";
import { EskoCharacter } from "@/components/EskoCharacter";
import { Navigation } from "@/components/Navigation";
import { Loader2, RefreshCw, AlertTriangle, Activity, Mountain, Sparkles, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: character, isLoading: isCharLoading } = useCharacter();
  const { data: stravaStatus, isLoading: isStravaLoading } = useStravaStatus();
  const { data: runs } = useRuns();
  const { mutate: createCharacter, isPending: isCreating } = useCreateCharacter();
  const { mutate: syncStrava, isPending: isSyncing } = useStravaSync();
  const { toast } = useToast();
  
  const [newCharName, setNewCharName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    createCharacter({ name: newCharName }, {
      onSuccess: () => toast({ title: "Companion Born!", description: `${newCharName} is ready to run.` })
    });
  };

  const handleSync = () => {
    syncStrava(undefined, {
      onSuccess: (data) => toast({ title: "Sync Complete", description: data.message }),
      onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" })
    });
  };

  if (isCharLoading || isStravaLoading) {
    return (
      <div className="min-h-screen aurora-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-white/80" />
          <p className="text-white/60 text-sm">Loading your companion...</p>
        </div>
      </div>
    );
  }

  // Case: No Character created yet
  if (!character && !isCharLoading) {
    return (
      <div className="min-h-screen aurora-bg flex flex-col md:flex-row">
        <Navigation />
        <main className="flex-1 p-6 md:p-12 flex items-center justify-center">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-xl">
            <div className="text-center mb-8">
              <Mountain size={48} className="mx-auto text-primary mb-4" />
              <h2 className="font-pixel text-lg text-foreground mb-2">New Game</h2>
              <p className="text-muted-foreground text-sm">
                You don't have a companion yet. Name your new friend to begin your journey.
              </p>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold mb-2 uppercase text-muted-foreground tracking-wide">
                  Companion Name
                </label>
                <input 
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full bg-background border-2 border-border p-4 rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                  placeholder="e.g. Bjornheim"
                  maxLength={12}
                  data-testid="input-character-name"
                />
              </div>
              <button 
                type="submit" 
                disabled={isCreating || !newCharName}
                className="w-full py-4 rounded-xl font-bold text-white bg-primary hover:brightness-110 transition-all disabled:opacity-50"
                data-testid="button-create-character"
              >
                {isCreating ? "Birthing..." : "Start Journey"}
              </button>
            </form>
          </div>
        </main>
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
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border-b-4 border-primary/20">
          <div className="flex items-center gap-4">
            <Mountain size={32} className="text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Konsekvens</h1>
              <p className="text-sm text-muted-foreground">Running Companion</p>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            {stravaStatus?.isConnected ? (
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                data-testid="button-sync-strava"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Activities"}
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

        {/* Main Content Grid */}
        <div className="max-w-6xl mx-auto grid gap-8">
          {/* Esko Character Display */}
          <div className="flex justify-center">
            <EskoCharacter
              totalRuns={character?.totalRuns || 0}
              name={character?.name || "Esko"}
              healthPercent={Math.max(0, 100 - (character?.healthState ?? 0) * 25)}
              isDead={character?.status === "dead"}
            />
          </div>

          {/* Stats Panel */}
          <div className="grid grid-cols-3 gap-4">
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

          {/* Tracker Connection & Recent Activities Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Activity Sync Panel */}
            <div className="section-panel">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                Activity Sync
              </h3>
              
              {stravaStatus?.isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="connected-dot" />
                    <span className="font-semibold text-foreground">Connected to Strava</span>
                  </div>
                  {stravaStatus.lastSync && (
                    <p className="text-sm text-muted-foreground">
                      Last synced: {format(new Date(stravaStatus.lastSync), "MMM d, h:mm a")}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Activities are automatically pulled from your Strava account. Click sync to check for new runs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">Tracker Not Connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect your Strava account to automatically sync your running activities.
                  </p>
                  <a 
                    href="/api/strava/connect" 
                    className="inline-flex items-center gap-2 px-5 py-3 strava-btn rounded-xl font-semibold text-sm"
                    data-testid="link-connect-strava-panel"
                  >
                    <Activity size={18} /> Log In with Strava
                  </a>
                </div>
              )}
            </div>

            {/* Recent Activities Panel */}
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
                            {(run.distance / 1000).toFixed(1)} km
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {Math.floor(run.duration / 60)} min
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(run.date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No activities logged yet. Start running to feed your companion!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
