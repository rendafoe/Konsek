"use client";

import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white p-4 border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
      <div className="flex items-start justify-between mb-2">
        <span className="font-pixel text-xs text-muted-foreground uppercase">{label}</span>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
      <div className="flex items-end gap-2">
        <span className="font-pixel text-lg md:text-xl font-bold text-foreground">{value}</span>
        {trend && (
           <span className={`text-xs mb-1 ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
             {trend === 'up' ? '▲' : '▼'}
           </span>
        )}
      </div>
    </div>
  );
}
