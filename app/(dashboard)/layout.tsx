"use client";

import { TopNav } from "@/components/TopNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SyncProvider } from "@/lib/sync-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SyncProvider>
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </SyncProvider>
  );
}
