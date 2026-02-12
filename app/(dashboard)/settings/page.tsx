"use client";

import { PageHeader } from "@/components/PageHeader";
import { useStravaStatus } from "@/hooks/use-strava";
import { useAuth } from "@/hooks/use-auth";
import { useReferralStats } from "@/hooks/use-referrals";
import { Loader2 } from "lucide-react";
import { PageBackground } from "@/components/PageBackground";

export default function Settings() {
  const { isLoading } = useStravaStatus();
  const { user } = useAuth();
  const { data: referralStats } = useReferralStats();

  return (
    <PageBackground src="/backgrounds/settings.webp" overlay={0.25}>
    <main className="flex-1 p-4 md:p-8">
      <PageHeader title="Settings" />

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

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
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

        <div className="text-xs text-muted-foreground text-center pt-8">
          v1.0.0 • Running Companion
        </div>
      </div>
    </main>
    </PageBackground>
  );
}
