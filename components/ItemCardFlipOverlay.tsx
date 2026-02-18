"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useItemOrigin } from "@/hooks/use-inventory";
import { useHaptics } from "@/hooks/use-haptics";
import { useDistanceUnit } from "@/hooks/use-distance-unit";
import { FantasyRouteMap } from "@/components/FantasyRouteMap";
import { Loader2, MapPin, Clock, Ruler, Sparkles } from "lucide-react";

const rarityGradients: Record<string, string> = {
  common: "from-gray-200 to-gray-300",
  uncommon: "from-green-200 to-green-300",
  rare: "from-blue-200 to-blue-300",
  epic: "from-purple-200 to-purple-300",
  legendary: "from-yellow-200 to-amber-300",
  mythic: "from-rose-200 to-pink-300",
};

const rarityBorderColors: Record<string, string> = {
  common: "border-gray-400",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
  mythic: "border-rose-500",
};

const rarityTextColors: Record<string, string> = {
  common: "text-gray-600",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
  mythic: "text-rose-600",
};

interface ItemCardFlipOverlayProps {
  item: {
    itemId: number;
    name: string;
    rarity: string;
    imageUrl: string;
    quote: string | null;
    equippedId: number | null;
  };
  open: boolean;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}


function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ItemCardFlipOverlay({ item, open, onClose }: ItemCardFlipOverlayProps) {
  const { data: origin, isLoading } = useItemOrigin(open ? item.itemId : null);
  const { playWithVibrate } = useHaptics();
  const { formatDistance } = useDistanceUnit();

  const rarity = item.rarity || "common";
  const gradient = rarityGradients[rarity] || rarityGradients.common;
  const borderColor = rarityBorderColors[rarity] || rarityBorderColors.common;
  const textColor = rarityTextColors[rarity] || rarityTextColors.common;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              playWithVibrate("tap", "tap");
              onClose();
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card container with perspective */}
          <div style={{ perspective: 1000 }} className="relative z-10 w-full max-w-[280px]">
            <motion.div
              className="relative w-full"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: 90, scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Card face (run details) */}
              <div
                className={`w-full rounded-2xl border-2 ${borderColor} bg-card overflow-hidden`}
                style={{ backfaceVisibility: "hidden" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : origin ? (
                  <div className="flex flex-col">
                    {/* Item header */}
                    <div className={`bg-gradient-to-br ${gradient} p-3 flex items-center gap-3`}>
                      <div className="w-12 h-12 bg-white/40 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-8 h-8 bg-muted rounded" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-pixel leading-tight break-words ${item.name.split(/\s+/).some((w) => w.length > 10) ? 'text-[8px]' : 'text-xs'}`}>{item.name}</h3>
                        <p className={`text-[10px] capitalize font-semibold ${textColor}`}>{rarity}</p>
                      </div>
                    </div>

                    {/* Run details */}
                    <div className="p-3 space-y-2.5">
                      <div className="space-y-1.5">
                        <p className="font-pixel text-[10px] text-muted-foreground uppercase tracking-wider">Found on run</p>
                        {origin.name && (
                          <p className="text-sm font-semibold truncate">{origin.name}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {formatDate(origin.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            {formatDistance(origin.distance)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(origin.duration)}
                          </span>
                        </div>
                      </div>

                      {origin.specialRewardCondition && (
                        <div className="flex items-start gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-yellow-700 dark:text-yellow-400">{origin.specialRewardCondition}</p>
                        </div>
                      )}

                      {/* Route map */}
                      {origin.polyline && (
                        <div className="rounded-lg overflow-hidden border border-border">
                          <FantasyRouteMap polyline={origin.polyline} activityName={origin.name ?? undefined} className="w-full" />
                        </div>
                      )}

                      {/* Item quote */}
                      {item.quote && (
                        <p className="text-[11px] text-muted-foreground italic text-center pt-1">
                          &ldquo;{item.quote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 p-4 text-center">
                    <p className="font-pixel text-xs text-muted-foreground">Origin Unknown</p>
                    <p className="text-[11px] text-muted-foreground mt-1">No run data found for this item</p>
                    {item.quote && (
                      <p className="text-[11px] text-muted-foreground italic mt-3">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
