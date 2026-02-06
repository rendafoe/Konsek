"use client";

import { Navigation } from "@/components/Navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen aurora-bg flex flex-col md:flex-row">
      <Navigation />
      {children}
    </div>
  );
}
