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
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/activities", icon: ClipboardList, label: "Log" },
  { href: "/inventory", icon: Sparkles, label: "Gear" },
  { href: "/achievements", icon: Trophy, label: "Achieve" },
  { href: "/friends", icon: Users, label: "Friends" },
  { href: "/archive", icon: Archive, label: "Archive" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 dark:bg-card/95 backdrop-blur-sm border-t border-border z-50 flex items-center justify-around p-2 shadow-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all
              ${isActive
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground"
              }
            `}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[8px] font-semibold uppercase tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
