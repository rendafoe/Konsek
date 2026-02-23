"use client";

import { PageBackground } from "@/components/PageBackground";
import { useNightMode } from "@/lib/night-mode-context";
import { useTutorial } from "@/lib/tutorial-context";
import {
  Heart, Footprints, Backpack, Trophy, Users, Sparkles,
  BookOpen, ShieldCheck, ExternalLink, RefreshCw,
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Esko, Your Companion",
    description:
      "Esko is a digital running companion that evolves through 8 stages as you complete runs. From a humble egg to a fully maxed form, every run helps Esko grow. But be careful — too many rest days and Esko's health will decline.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Footprints,
    title: "Running & Health",
    description:
      "Any run of at least 1 km synced from Strava counts toward keeping Esko healthy. Esko has 4 health states: Perfect, Rested, Weak, and Critical. After 2 consecutive rest days, health starts to drop. Stay consistent to keep Esko thriving.",
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  {
    icon: Backpack,
    title: "Collectible Items",
    description:
      "There are 55 unique items to collect, spanning 6 rarity tiers: Common, Uncommon, Rare, Epic, Legendary, and Mythic. Items are awarded randomly after runs.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Sparkles,
    title: "Medals",
    description:
      "Medals are the in-game currency. Earn them from item drops, daily check-ins, evolving Esko, and referring friends. Medals can be spent to buy Mythic items.",
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Track your item collection progress in the Achievements tab. Your achievement percentage reflects how many of the 55 items you've unlocked.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Users,
    title: "Friends & Referrals",
    description:
      "Connect with other runners using your unique friend code. Browse the Discover tab to find and add new friends. Share your referral link to earn bonus medals when friends join Konsek.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: RefreshCw,
    title: "Strava Sync",
    description:
      "Konsek syncs your runs directly from Strava. Hit the Sync button in the top navigation to pull your latest activities. New runs will update Esko's health, evolution progress, and may award items and medals.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export default function Info() {
  const { isNight } = useNightMode();
  const { openTutorial } = useTutorial();

  return (
    <PageBackground src={isNight ? "/backgrounds/home-night.webp" : "/backgrounds/home-day.webp"} overlay={0.2}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {/* Replay Tutorial Card */}
          <button
            onClick={openTutorial}
            className="w-full cozy-card p-5 flex items-center gap-4 hover:border-primary/30 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <BookOpen size={22} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-pixel text-xs text-foreground mb-0.5">Replay Tutorial</h3>
              <p className="text-sm text-muted-foreground">
                Walk through the guided introduction to all of Konsek's features
              </p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </button>

          {/* About Section */}
          <section className="cozy-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <img src="/esko/esko-hatchling-v1.png" alt="Konsek" className="w-10 h-10 rounded-xl shadow-sm" />
              <div>
                <h2 className="font-pixel text-sm text-foreground">About Konsek</h2>
                <p className="text-xs text-muted-foreground">Your consistency rewarded</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Konsek is a gamified fitness companion app that syncs with your Strava activities to turn your running consistency into an adventure. Care for your pet Esko, collect rare items, earn medals, and connect with friends — all fueled by real movement.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Built by runner for runners. Whether you run 1 mile or 100 miles, every run counts towards consistency.
            </p>
          </section>

          {/* Feature Breakdown */}
          <section>
            <h2 className="font-pixel text-xs text-card-foreground/80 uppercase tracking-wider mb-4 bg-card/70 backdrop-blur-sm rounded-lg px-4 py-2 w-fit border border-border/50">
              Features
            </h2>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature.title} className="cozy-card p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${feature.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <feature.icon size={18} className={feature.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Reference */}
          <section className="cozy-card p-5">
            <h2 className="font-pixel text-xs text-muted-foreground uppercase tracking-wider mb-4">Quick Reference</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Min Run Distance</p>
                <p className="text-muted-foreground">1 km</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Esko Health Decay</p>
                <p className="text-muted-foreground">After 2 rest days</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Evolution Stages</p>
                <p className="text-muted-foreground">8 stages</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Total Items</p>
                <p className="text-muted-foreground">55 collectibles</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Item Rarities</p>
                <p className="text-muted-foreground">6 tiers (Common to Mythic)</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold text-foreground mb-1">Daily Check-in</p>
                <p className="text-muted-foreground">Additional Medal bonus each day</p>
              </div>
            </div>
          </section>

          {/* Privacy & Contact */}
          <section className="cozy-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-primary" />
              <h2 className="font-pixel text-xs text-muted-foreground uppercase tracking-wider">Privacy & Data</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Konsek only accesses your Strava run activities (distance, duration, date, and route data). We never share your personal data with third parties. Your Strava connection can be managed in Settings.
            </p>
          </section>

          <div className="text-xs text-muted-foreground text-center pt-4 pb-8">
            v1.0.0 &middot; Running Companion
          </div>
        </div>
      </main>
    </PageBackground>
  );
}
