import { useAchievements } from "@/hooks/use-achievements";
import { Navigation } from "@/components/Navigation";
import { Loader2, Trophy, Lock, Star } from "lucide-react";

const rarityColors: Record<string, string> = {
  common: "border-gray-400",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
};

const rarityTextColors: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-green-500",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-yellow-500",
};

export default function Achievements() {
  const { data, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  // Sort alphabetically
  const items = data?.items?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  const unlockedCount = items.filter((i) => i.unlocked).length;
  const totalCount = items.length;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-ui">
      <Navigation />

      <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={28} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-pixel text-foreground">Achievements</h1>
          </div>
          <p className="text-muted-foreground">
            Collect all items from your running adventures.
            <span className="ml-2 font-semibold text-foreground">
              {unlockedCount} / {totalCount} unlocked
            </span>
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`
                bg-card p-3 pixel-border relative transition-all
                border-2 ${rarityColors[item.rarity] || "border-gray-400"}
                ${item.unlocked
                  ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background shadow-lg shadow-green-500/20"
                  : "opacity-50 grayscale"
                }
              `}
            >
              {/* Lock icon for locked items */}
              {!item.unlocked && (
                <div className="absolute top-2 right-2 z-10">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}

              {/* Special reward star */}
              {item.isSpecialReward && (
                <div className="absolute top-2 left-2 z-10">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
              )}

              {/* Item image */}
              <div className="aspect-square bg-background border-2 border-border mb-2 flex items-center justify-center overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={`w-full h-full object-contain ${!item.unlocked ? "opacity-40" : ""}`}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Item name */}
              <h3 className="font-pixel text-[9px] truncate mb-1" title={item.name}>
                {item.name}
              </h3>

              {/* Rarity */}
              <p className={`text-[8px] capitalize ${rarityTextColors[item.rarity] || "text-gray-400"}`}>
                {item.rarity}
              </p>

              {/* Special reward condition */}
              {item.isSpecialReward && item.specialRewardCondition && (
                <p className="text-[7px] text-amber-600 mt-1 truncate" title={item.specialRewardCondition}>
                  {item.specialRewardCondition}
                </p>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-pixel text-sm text-muted-foreground">No Items Available</p>
            <p className="text-xs text-muted-foreground mt-2">Check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
}
