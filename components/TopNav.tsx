"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStravaStatus } from "@/hooks/use-strava";
import { useMedalStatus } from "@/hooks/use-medals";
import { useAuth } from "@/hooks/use-auth";
import { useSyncContext } from "@/lib/sync-context";
import { useHaptics } from "@/hooks/use-haptics";
import {
  Home,
  Sparkles,
  Archive,
  Settings,

  ClipboardList,
  Trophy,
  Users,
  RefreshCw,
  LogOut,
  Skull,
  Backpack,
  FlameKindling,
  Info,
} from "lucide-react";
import { format } from "date-fns";

const navItems = [
  { href: "/", icon: FlameKindling, label: "Esko" },
  { href: "/activities", icon: ClipboardList, label: "Activity Log" },
  { href: "/inventory", icon: Backpack, label: "Gear" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/archive", icon: Skull, label: "Graveyard" },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: stravaStatus } = useStravaStatus();
  const { data: medalStatus } = useMedalStatus();
  const { logout } = useAuth();
  const { sync, isSyncing } = useSyncContext();
  const { play, playWithVibrate } = useHaptics();

  return (
    <nav className="bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4 gap-4 z-50 shadow-sm" style={{ height: "calc(3.5rem + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)" }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <img src="/esko/esko-hatchling-v1.png" alt="Konsek" className="w-8 h-8 rounded-lg shadow-sm" />
        <span className="text-sm font-bold text-foreground hidden sm:block">
          Konsek
        </span>
      </Link>

      {/* Center Nav Icons - Desktop */}
      <div className="hidden md:flex items-center gap-1 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => play("tap")}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3 ml-auto md:ml-0 shrink-0">
        {/* Medal Counter */}
        {medalStatus && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-lg">
            <img src="/items/medal.png" alt="Medals" className="w-4 h-4" />
            <span className="font-bold text-sm text-yellow-700 dark:text-yellow-400">
              {medalStatus.balance}
            </span>
          </div>
        )}

        {/* Strava Profile */}
        {stravaStatus?.isConnected && stravaStatus.athleteProfilePicture && (
          <img
            src={stravaStatus.athleteProfilePicture}
            alt={stravaStatus.athleteName || "Profile"}
            className="w-8 h-8 rounded-full border-2 border-primary/30 hidden sm:block"
            title={stravaStatus.lastSync
              ? `${stravaStatus.athleteName} · Synced ${format(new Date(stravaStatus.lastSync), "MMM d, h:mm a")}`
              : stravaStatus.athleteName || undefined
            }
          />
        )}

        {/* Sync Button */}
        <button
          onClick={() => { playWithVibrate("tap"); sync(); }}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
          data-testid="button-sync-strava"
        >
          <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
        </button>

        {/* Info - Desktop */}
        <Link
          href="/info"
          className="hidden md:flex items-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          data-testid="nav-info"
        >
          <Info size={18} />
        </Link>

        {/* Settings - Desktop */}
        <Link
          href="/settings"
          className="hidden md:flex items-center p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          data-testid="nav-settings"
        >
          <Settings size={18} />
        </Link>

        {/* Logout - Desktop */}
        <button
          onClick={() => logout()}
          className="hidden md:flex items-center p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          data-testid="button-logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
