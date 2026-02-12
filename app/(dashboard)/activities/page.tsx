"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/use-activities";
import { PageHeader } from "@/components/PageHeader";
import { PageBackground } from "@/components/PageBackground";
import { useNightMode } from "@/lib/night-mode-context";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const rarityBadgeStyles: Record<string, string> = {
  common: "bg-amber-100 text-amber-800 border-amber-400",
  uncommon: "bg-green-100 text-green-800 border-green-400",
  rare: "bg-blue-100 text-blue-800 border-blue-400",
  epic: "bg-purple-100 text-purple-800 border-purple-400",
  legendary: "bg-yellow-100 text-yellow-900 border-yellow-500",
  mythic: "bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 text-purple-800 border-purple-400",
};

const rarityMedalRewards: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 5,
  legendary: 8,
  mythic: 0,
};

function calculateMedalsFromItems(items: Array<{ item?: { rarity: string } }>): number {
  return items.reduce((total, ri) => {
    if (ri.item) {
      return total + (rarityMedalRewards[ri.item.rarity] || 0);
    }
    return total;
  }, 0);
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export default function ActivityLog() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useActivities({ page, limit: ITEMS_PER_PAGE });
  const { isNight } = useNightMode();

  const activities = data?.activities || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <PageBackground src={isNight ? "/backgrounds/home-night.webp" : "/backgrounds/home-day.webp"} overlay={0.2}>
        <div className="flex-1 flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin w-10 h-10 text-white/80" />
            <p className="text-white/60 text-sm">Loading activity log...</p>
          </div>
        </div>
      </PageBackground>
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.totalPages)) {
      setPage(newPage);
    }
  };

  return (
    <PageBackground src={isNight ? "/backgrounds/home-night.webp" : "/backgrounds/home-day.webp"} overlay={0.15}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <PageHeader title="Activity Log" subtitle="Your complete running history with items found" />

        {/* Activity list container */}
        <div className="max-w-2xl mx-auto relative">
          {/* Mobile: card layout */}
          <div className="md:hidden cozy-card p-4 relative">
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10 rounded-2xl">
                <Loader2 className="animate-spin w-6 h-6 text-primary" />
              </div>
            )}

            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <ClipboardList className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="font-pixel text-sm text-foreground">No Activities Yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Go for a run to start building your log!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel text-[11px] text-foreground truncate">
                        {activity.name || "Run"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(activity.date), "MMM d, yyyy")} · {formatDuration(activity.duration)} · {formatDistance(activity.distance)}
                      </div>
                    </div>
                    {activity.awardedItems && activity.awardedItems.length > 0 && (
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <div className="flex flex-wrap gap-1 justify-end">
                          {activity.awardedItems.slice(0, 2).map((ri: any, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                ri.item ? rarityBadgeStyles[ri.item.rarity] : ""
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              {ri.item?.name || "Item"}
                            </Badge>
                          ))}
                          {activity.awardedItems.length > 2 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-800">
                              +{activity.awardedItems.length - 2}
                            </Badge>
                          )}
                        </div>
                        {calculateMedalsFromItems(activity.awardedItems) > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <img src="/items/medal.png" alt="" className="w-3 h-3" />
                            +{calculateMedalsFromItems(activity.awardedItems)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: parchment scroll background */}
          <div
            className="hidden md:flex relative min-h-[700px] flex-col"
            style={{
              backgroundImage: "url(/backgrounds/scroll.webp)",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center top",
            }}
          >
            <div className="px-[14%] pt-[10%] pb-[12%] flex-1 relative">
              {isFetching && !isLoading && (
                <div className="absolute inset-0 bg-amber-50/50 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="animate-spin w-6 h-6 text-amber-700" />
                </div>
              )}

              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <ClipboardList className="w-10 h-10 text-amber-700/40 mb-3" />
                  <p className="font-pixel text-sm text-amber-900">No Activities Yet</p>
                  <p className="text-xs text-amber-800/70 mt-1">
                    Go for a run to start building your log!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-900/5 hover:bg-amber-900/10 transition-colors border border-amber-900/10"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-pixel text-[11px] text-amber-900 truncate">
                          {activity.name || "Run"}
                        </div>
                        <div className="text-[10px] text-amber-800/70 mt-0.5">
                          {format(new Date(activity.date), "MMM d, yyyy")} · {formatDuration(activity.duration)} · {formatDistance(activity.distance)}
                        </div>
                      </div>
                      {activity.awardedItems && activity.awardedItems.length > 0 && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {activity.awardedItems.slice(0, 2).map((ri: any, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 ${
                                  ri.item ? rarityBadgeStyles[ri.item.rarity] : ""
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                {ri.item?.name || "Item"}
                              </Badge>
                            ))}
                            {activity.awardedItems.length > 2 && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-800">
                                +{activity.awardedItems.length - 2}
                              </Badge>
                            )}
                          </div>
                          {calculateMedalsFromItems(activity.awardedItems) > 0 && (
                            <div className="flex items-center gap-1 text-[9px] text-amber-800">
                              <img src="/items/medal.png" alt="" className="w-3 h-3" />
                              +{calculateMedalsFromItems(activity.awardedItems)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination controls below scroll */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <p className="text-xs text-white/70" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-amber-900/20 backdrop-blur-sm border border-amber-700/30 text-amber-100 hover:bg-amber-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  className="text-sm font-pixel text-amber-100 px-2"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                >
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-lg bg-amber-900/20 backdrop-blur-sm border border-amber-700/30 text-amber-100 hover:bg-amber-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageBackground>
  );
}
