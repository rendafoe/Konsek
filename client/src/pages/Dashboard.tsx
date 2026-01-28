import { useCharacter, useCreateCharacter } from "@/hooks/use-character";
import { useStravaStatus, useStravaSync } from "@/hooks/use-strava";
import { useRuns } from "@/hooks/use-runs";
import { PixelCharacter } from "@/components/PixelCharacter";
import { StatCard } from "@/components/StatCard";
import { Navigation } from "@/components/Navigation";
import { Loader2, RefreshCw, AlertTriangle, Activity } from "lucide-react";
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
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  // Case: No Character created yet
  if (!character && !isCharLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <Navigation />
        <main className="flex-1 p-6 md:p-12 flex items-center justify-center">
           <div className="max-w-md w-full bg-card p-8 pixel-border">
             <h2 className="text-xl font-pixel mb-4 text-center">New Game</h2>
             <p className="text-muted-foreground mb-6 text-center text-sm">
               You don't have a companion yet. Name your new friend to begin your journey.
             </p>
             <form onSubmit={handleCreate} className="space-y-4">
               <div>
                 <label className="block text-xs font-pixel mb-2 uppercase text-muted-foreground">Name</label>
                 <input 
                   value={newCharName}
                   onChange={(e) => setNewCharName(e.target.value)}
                   className="w-full bg-background border-2 border-border p-3 font-pixel text-sm focus:outline-none focus:border-primary transition-colors"
                   placeholder="e.g. Runner"
                   maxLength={12}
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={isCreating || !newCharName}
                 className="w-full pixel-btn-primary py-3"
               >
                 {isCreating ? "Birthing..." : "Start Journey"}
               </button>
             </form>
           </div>
        </main>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-ui">
      <Navigation />
      
      <main className="flex-1 p-6 md:p-12 overflow-y-auto mb-20 md:mb-0">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-pixel text-foreground mb-2">
              {character?.name}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${character?.status === 'alive' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
                 Day {character?.daysAlive || 0}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {stravaStatus?.isConnected ? (
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className="pixel-btn-outline flex items-center gap-2 text-xs"
              >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Strava"}
              </button>
            ) : (
              <a href="/api/strava/connect" className="pixel-btn-secondary text-xs flex items-center gap-2">
                 <AlertTriangle size={14} /> Connect Strava
              </a>
            )}
          </div>
        </header>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
           {/* Character Stage */}
           <div className="lg:col-span-2 bg-card min-h-[400px] pixel-border relative flex flex-col items-center justify-center overflow-hidden group">
              {/* Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-amber-50/50 opacity-50" />
              <div className="absolute bottom-0 w-full h-1/3 bg-white border-t-2 border-border/20" />
              
              {/* Character */}
              <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                <PixelCharacter 
                  healthState={character?.healthState ?? 0} 
                  status={character?.status as "alive" | "dead"} 
                  scale={3} 
                />
              </div>

              {/* Status HUD */}
              <div className="absolute top-6 left-6 z-20 bg-white/80 backdrop-blur-sm p-4 border-2 border-border/50">
                 <div className="text-[10px] font-pixel text-muted-foreground mb-2 uppercase">Condition</div>
                 <div className="text-sm font-bold text-foreground">
                    {character?.status === 'dead' ? 'DECEASED' : 
                     (character?.healthState ?? 0) === 0 ? 'PEAK PERFORMANCE' :
                     (character?.healthState ?? 0) < 3 ? 'NEEDS EXERCISE' : 'CRITICAL'}
                 </div>
              </div>
           </div>

           {/* Stats Column */}
           <div className="flex flex-col gap-4">
              <StatCard 
                label="Total Distance" 
                value={`${Math.round((character?.totalDistance || 0) / 1000)} km`}
                trend="up"
              />
              <StatCard 
                label="Total Runs" 
                value={character?.totalRuns || 0} 
              />
              <StatCard 
                label="Current Health" 
                value={character?.healthState === 0 ? "100%" : character?.healthState === 1 ? "75%" : "25%"}
                icon={<Activity size={16} />}
              />
              
              {/* Recent Activity Mini-List */}
              <div className="bg-card p-4 pixel-border flex-1">
                 <h3 className="font-pixel text-xs mb-4 uppercase text-muted-foreground">Recent Runs</h3>
                 <div className="space-y-3">
                   {runs?.slice(0, 3).map(run => (
                     <div key={run.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0">
                       <span className="text-muted-foreground">{format(new Date(run.date), "MMM d")}</span>
                       <span className="font-bold">{(run.distance / 1000).toFixed(1)} km</span>
                     </div>
                   ))}
                   {!runs?.length && <p className="text-xs text-muted-foreground italic">No recent activity.</p>}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
