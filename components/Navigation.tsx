"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Home, Sparkles, Archive, LogOut, Settings, Mountain, ClipboardList, Trophy } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/activities", icon: ClipboardList, label: "Log" },
    { href: "/inventory", icon: Sparkles, label: "Gear" },
    { href: "/achievements", icon: Trophy, label: "Achieve" },
    { href: "/archive", icon: Archive, label: "Archive" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full md:static md:w-20 lg:w-24 md:min-h-screen bg-white/95 dark:bg-card backdrop-blur-sm border-t md:border-t-0 md:border-r-2 border-border z-50 flex md:flex-col items-center justify-between p-3 md:py-8 shadow-lg md:shadow-none">
      {/* Logo Area */}
      <div className="hidden md:flex flex-col items-center mb-10">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2 shadow-md">
          <Mountain size={24} className="text-white" />
        </div>
        <span className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-wider">
          Konse<br/>kvens
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex md:flex-col gap-2 md:gap-3 w-full justify-around md:justify-start md:px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                ${isActive
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-semibold hidden md:block uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="hidden md:flex flex-col gap-2 mt-auto px-2 w-full">
        <Link
          href="/settings"
          className="flex flex-col items-center gap-1 p-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          data-testid="nav-settings"
        >
          <Settings size={22} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Settings</span>
        </Link>
        <button
          onClick={() => logout()}
          className="flex flex-col items-center gap-1 p-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          data-testid="button-logout"
        >
          <LogOut size={22} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Logout</span>
        </button>
      </div>

      {/* Mobile Settings */}
      <div className="md:hidden flex gap-2">
        <Link
          href="/settings"
          className="p-3 rounded-xl text-muted-foreground hover:bg-muted transition-all"
        >
          <Settings size={22} />
        </Link>
      </div>
    </nav>
  );
}
