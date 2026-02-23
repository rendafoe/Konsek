"use client";

import { useStravaStatus } from "@/hooks/use-strava";
import { useAuth } from "@/hooks/use-auth";
import { useReferralStats } from "@/hooks/use-referrals";
import { useHaptics } from "@/hooks/use-haptics";
import { signIn } from "next-auth/react";
import { Loader2, LogOut, Volume2, Vibrate, RefreshCw, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageBackground } from "@/components/PageBackground";

export default function Settings() {
  const { data: stravaStatus, isLoading } = useStravaStatus();
  const { user, logout } = useAuth();
  const { data: referralStats } = useReferralStats();
  const { prefs, toggleSound, toggleHaptics } = useHaptics();
  const supportsVibration = typeof navigator !== "undefined" && "vibrate" in navigator;

  return (
    <PageBackground src="/backgrounds/settings.webp" overlay={0.25}>
    <main className="flex-1 p-4 md:p-8">

      <div className="max-w-xl space-y-8">
        {/* Account Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Account</h2>
          <div className="flex items-center gap-4 mb-6">
            {user?.image && (
              <img src={user.image} alt="Profile" className="w-12 h-12 rounded-lg border border-border" />
            )}
            <div>
              <p className="font-bold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Integrations</h2>

          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Strava</h3>
                <p className="text-xs text-muted-foreground">Sync your runs automatically</p>
              </div>
              {isLoading ? (
                <Loader2 className="animate-spin text-muted-foreground" size={16} />
              ) : (
                <span className="text-xs text-green-600 font-bold uppercase">Connected</span>
              )}
            </div>

            {!isLoading && stravaStatus?.isConnected && !stravaStatus.hasFullAccess && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Missing permissions to sync followers-only or private activities. Reconnect to fix.
                </p>
              </div>
            )}

            {!isLoading && stravaStatus?.isConnected && (
              <button
                onClick={() => signIn("strava", { callbackUrl: "/settings" }, { approval_prompt: "force" })}
                className="flex items-center justify-center gap-2 w-full p-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <RefreshCw size={12} />
                Reconnect Strava
              </button>
            )}
          </div>
        </section>

        {/* Referral Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Referral</h2>
          <div className="p-4 bg-muted/30 rounded-lg">
            {referralStats?.referredBy ? (
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Referred by {referralStats.referredBy.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(referralStats.referredBy.date).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not referred by anyone</p>
            )}
          </div>
        </section>

        {/* Preferences Section */}
        <section className="cozy-card p-5">
          <h2 className="font-pixel text-sm uppercase mb-4 text-muted-foreground">Preferences</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-muted-foreground" />
                <div>
                  <h3 className="font-bold text-sm">Sound Effects</h3>
                  <p className="text-xs text-muted-foreground">Play sounds on interactions</p>
                </div>
              </div>
              <Switch checked={prefs.soundEnabled} onCheckedChange={toggleSound} />
            </div>

            {supportsVibration && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Vibrate size={18} className="text-muted-foreground" />
                  <div>
                    <h3 className="font-bold text-sm">Haptic Feedback</h3>
                    <p className="text-xs text-muted-foreground">Vibrate on interactions</p>
                  </div>
                </div>
                <Switch checked={prefs.hapticsEnabled} onCheckedChange={toggleHaptics} />
              </div>
            )}
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-semibold text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>

        <div className="text-xs text-muted-foreground text-center pt-4">
          v1.0.0 • Running Companion
        </div>
      </div>
    </main>
    </PageBackground>
  );
}
