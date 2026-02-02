import { useStravaStatus, useStravaSync } from "@/hooks/use-strava";
import { useMedalStatus } from "@/hooks/use-medals";
import { RefreshCw, Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onSyncSuccess?: (data: any) => void;
}

export function PageHeader({ title, subtitle, onSyncSuccess }: PageHeaderProps) {
  const { data: stravaStatus } = useStravaStatus();
  const { data: medalStatus } = useMedalStatus();
  const { mutate: syncStrava, isPending: isSyncing } = useStravaSync();
  const { toast } = useToast();

  const handleSync = () => {
    syncStrava(undefined, {
      onSuccess: (data) => {
        toast({ title: "Sync Complete", description: data.message });
        if (onSyncSuccess) {
          onSyncSuccess(data);
        }
      },
      onError: (err) => toast({ title: "Sync Failed", description: err.message, variant: "destructive" })
    });
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm rounded-xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border-b-4 border-primary/20">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {/* Medal Counter */}
        {medalStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <img src="/items/medal.png" alt="Medals" className="w-5 h-5" />
            <span className="font-bold text-yellow-700">{medalStatus.balance}</span>
          </div>
        )}

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
  );
}
