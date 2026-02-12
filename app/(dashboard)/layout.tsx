"use client";

import { TopNav } from "@/components/TopNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SyncProvider } from "@/lib/sync-context";
import { NightModeProvider } from "@/lib/night-mode-context";
import { TutorialProvider } from "@/lib/tutorial-context";
import { Tutorial } from "@/components/Tutorial";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NightModeProvider>
      <SyncProvider>
        <TutorialProvider>
          <div className="min-h-screen flex flex-col">
            <TopNav />
            <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </div>
            <MobileBottomNav />
          </div>
          <Tutorial />
        </TutorialProvider>
      </SyncProvider>
    </NightModeProvider>
  );
}
