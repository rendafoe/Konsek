"use client";

import { PageHeader } from "@/components/PageHeader";
import { useStravaStatus } from "@/hooks/use-strava";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { data: stravaStatus, isLoading } = useStravaStatus();
  const { user } = useAuth();

  return (
    <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0">
      <PageHeader title="Settings" />

      <div className="max-w-xl space-y-8">
        {/* Account Section */}
        <section className="bg-card p-6 pixel-border">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Account</h2>
          <div className="flex items-center gap-4 mb-6">
            {user?.image && (
              <img src={user.image} alt="Profile" className="w-12 h-12 rounded border-2 border-black" />
            )}
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="bg-card p-6 pixel-border">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Integrations</h2>

          <div className="flex items-center justify-between p-4 bg-white border-2 border-border">
            <div>
              <h3 className="font-bold text-sm">Strava</h3>
              <p className="text-xs text-muted-foreground">Sync your runs automatically</p>
            </div>

            {isLoading ? (
              <Loader2 className="animate-spin text-muted-foreground" size={16} />
            ) : stravaStatus?.isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-green-600 font-bold uppercase">Connected</span>
              </div>
            ) : (
              <a href="/api/strava/connect" className="pixel-btn-secondary text-xs">Connect</a>
            )}
          </div>
        </section>

        <div className="text-xs text-muted-foreground text-center pt-8">
          v1.0.0 • Running Companion
        </div>
      </div>
    </main>
  );
}
