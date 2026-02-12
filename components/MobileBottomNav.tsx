"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Archive,
  ClipboardList,
  Trophy,
  Users,
  Settings,
  Skull,
  Backpack,
  FlameKindling,
  Info,
} from "lucide-react";

const navItems = [
  { href: "/", icon: FlameKindling, label: "Esko" },
  { href: "/activities", icon: ClipboardList, label: "Activity" },
  { href: "/inventory", icon: Backpack, label: "Gear" },
  { href: "/achievements", icon: Trophy, label: "Achieve" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/archive", icon: Skull, label: "Archive" },
  { href: "/info", icon: Info, label: "Info" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-card/95 backdrop-blur-sm border-t border-border z-50 flex items-center justify-around px-2 pt-2 shadow-lg" style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all min-w-0 overflow-hidden
              ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground"
              }
            `}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
            <span className="text-[7px] font-semibold uppercase tracking-wide truncate max-w-full">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
