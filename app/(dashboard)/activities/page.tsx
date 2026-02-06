"use client";

import { useState } from "react";
import { useActivities } from "@/hooks/use-activities";
import { PageHeader } from "@/components/PageHeader";
import { MiniRouteMap } from "@/components/MiniRouteMap";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Sparkles } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 25;

const rarityBadgeStyles: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-green-100 text-green-700 border-green-300",
  rare: "bg-blue-100 text-blue-700 border-blue-300",
  epic: "bg-purple-100 text-purple-700 border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-400",
  mythic: "bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 text-purple-700 border-purple-300",
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

  const activities = data?.activities || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-10 h-10 text-white/80" />
          <p className="text-white/60 text-sm">Loading activity log...</p>
        </div>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!pagination || newPage <= pagination.totalPages)) {
      setPage(newPage);
    }
  };

  const getVisiblePages = () => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto mb-20 md:mb-0">
      <PageHeader title="Activity Log" subtitle="Your complete running history with items found" />

      <div className="section-panel relative">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="font-pixel text-sm text-muted-foreground">No Activities Yet</p>
            <p className="text-xs text-muted-foreground mt-2">
              Go for a run to start building your log!
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[120px]">Title</TableHead>
                    <TableHead className="min-w-[80px]">Duration</TableHead>
                    <TableHead className="min-w-[80px]">Distance</TableHead>
                    <TableHead className="min-w-[70px]">Route</TableHead>
                    <TableHead className="min-w-[120px]">Rewards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {format(new Date(activity.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {activity.name || "Run"}
                      </TableCell>
                      <TableCell>{formatDuration(activity.duration)}</TableCell>
                      <TableCell>{formatDistance(activity.distance)}</TableCell>
                      <TableCell>
                        <MiniRouteMap
                          polyline={activity.polyline}
                          width={60}
                          height={40}
                        />
                      </TableCell>
                      <TableCell>
                        {activity.awardedItems && activity.awardedItems.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap gap-1">
                              {activity.awardedItems.map((ri: any, idx: number) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0.5 ${
                                    ri.item ? rarityBadgeStyles[ri.item.rarity] : ""
                                  }`}
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {ri.item?.name || "Item"}
                                </Badge>
                              ))}
                            </div>
                            {calculateMedalsFromItems(activity.awardedItems) > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-yellow-700">
                                <img src="/items/medal.png" alt="" className="w-3 h-3" />
                                +{calculateMedalsFromItems(activity.awardedItems)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} activities
                </p>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {getVisiblePages().map((p, idx) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink
                            onClick={() => handlePageChange(p)}
                            isActive={p === page}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className={
                          page === pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <Loader2 className="animate-spin w-6 h-6 text-primary" />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
