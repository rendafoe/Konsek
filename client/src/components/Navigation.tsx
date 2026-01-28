import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, List, Archive, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Navigation() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast({ title: "Logged out", description: "See you next run!" });
      }
    });
  };

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/inventory", icon: List, label: "Gear" },
    { href: "/archive", icon: Archive, label: "History" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full md:left-0 md:top-0 md:bottom-auto md:w-24 md:h-screen bg-card border-t-4 md:border-t-0 md:border-r-4 border-border z-50 flex md:flex-col items-center justify-between p-4 md:py-8">
      {/* Logo Area */}
      <div className="hidden md:flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-primary mb-2 border-4 border-black" />
        <span className="font-pixel text-[10px] text-center leading-tight">RUN<br/>COMP</span>
      </div>

      {/* Nav Links */}
      <div className="flex md:flex-col gap-6 md:gap-8 w-full justify-around md:justify-start">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
                flex flex-col items-center gap-1 group transition-colors
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}>
                <div className={`p-2 rounded-none transition-transform group-hover:-translate-y-1 ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon size={24} strokeWidth={isActive ? 3 : 2} />
                </div>
                <span className="font-pixel text-[8px] md:text-[10px] hidden sm:block">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="hidden md:flex flex-col gap-4 mt-auto">
        <Link href="/settings" className="p-2 text-muted-foreground hover:text-foreground transition-transform hover:-translate-y-1">
          <Settings size={24} />
        </Link>
        <button 
          onClick={handleLogout}
          className="p-2 text-destructive hover:text-destructive/80 transition-transform hover:-translate-y-1"
        >
          <LogOut size={24} />
        </button>
      </div>
      
      {/* Mobile Settings/Logout would likely be in a drawer, simplified here */}
      <div className="md:hidden">
          <Link href="/settings" className="text-muted-foreground hover:text-foreground">
             <Settings size={24} />
          </Link>
      </div>
    </nav>
  );
}
