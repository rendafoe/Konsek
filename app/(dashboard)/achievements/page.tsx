"use client";

import { useAchievements } from "@/hooks/use-achievements";
import { useMedalStatus, usePurchaseItem } from "@/hooks/use-medals";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Trophy, Lock, Star, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const rarityTextColors: Record<string, string> = {
  common: "text-gray-500",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
  mythic: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500",
};

const rarityBorderColors: Record<string, string> = {
  common: "border-gray-400/60",
  uncommon: "border-green-500/70",
  rare: "border-blue-500/70",
  epic: "border-purple-500/70",
  legendary: "border-yellow-500/70",
};

export default function Achievements() {
  const { data, isLoading } = useAchievements();
  const { data: medalStatus } = useMedalStatus();
  const { mutate: purchaseItem, isPending: isPurchasing } = usePurchaseItem();
  const { toast } = useToast();
  const [purchasingItemId, setPurchasingItemId] = useState<number | null>(null);

  const handlePurchase = (itemId: number, itemName: string, price: number) => {
    if (!medalStatus || medalStatus.balance < price) {
      toast({ title: "Insufficient Medals", description: `You need ${price} Medals to purchase this item.`, variant: "destructive" });
      return;
    }
    setPurchasingItemId(itemId);
    purchaseItem(itemId, {
      onSuccess: () => { toast({ title: "Item Purchased!", description: `You obtained ${itemName}!` }); setPurchasingItemId(null); },
      onError: (err) => { toast({ title: "Purchase Failed", description: err.message, variant: "destructive" }); setPurchasingItemId(null); },
    });
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const allItems = data?.items || [];
  const mythicItems = allItems.filter((i) => i.rarity === "mythic").sort((a, b) => a.name.localeCompare(b.name));
  const regularItems = allItems.filter((i) => i.rarity !== "mythic").sort((a, b) => a.name.localeCompare(b.name));
  const unlockedCount = allItems.filter((i) => i.unlocked).length;
  const totalCount = allItems.length;

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
      <PageHeader title="Achievements" subtitle={`Collect all items from your running adventures. ${unlockedCount} / ${totalCount} unlocked`} />

      {mythicItems.length > 0 && (
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-4 bg-card/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
            <Sparkles size={18} className="text-yellow-500" />
            <h2 className="text-base font-pixel text-card-foreground">Mythic Collection</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mythicItems.map((item) => (
              <div key={item.id} className={`cozy-card p-3 relative transition-all duration-200 group border-2 border-yellow-500/70 hover:-translate-y-1 hover:shadow-md ${item.unlocked ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background shadow-lg shadow-green-500/20" : ""}`}
                style={{ boxShadow: "0 0 12px rgba(234, 179, 8, 0.15), 0 2px 12px rgba(27, 67, 50, 0.06)" }}>
                {!item.unlocked && <div className="absolute top-2 right-2 z-10"><Lock className="w-4 h-4 text-yellow-600/60" /></div>}
                <div className="absolute top-2 left-2 z-10"><Sparkles className="w-4 h-4 text-yellow-400" /></div>
                <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-contain transition-all duration-200 ${!item.unlocked ? "opacity-60 grayscale-[50%] group-hover:opacity-100 group-hover:grayscale-0" : ""}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
                <h3 className="font-pixel text-[9px] truncate mb-1 text-foreground" title={item.name}>{item.name}</h3>
                <p className={`text-[8px] capitalize font-bold ${rarityTextColors[item.rarity]}`}>{item.rarity}</p>
                {item.unlocked ? (
                  <div className="mt-2 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded text-center">Owned</div>
                ) : item.price ? (
                  <button onClick={() => handlePurchase(item.id, item.name, item.price!)} disabled={isPurchasing && purchasingItemId === item.id}
                    className={`mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded transition-all ${medalStatus && medalStatus.balance >= item.price ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:brightness-110 cursor-pointer" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"}`}>
                    {isPurchasing && purchasingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><img src="/items/medal.png" alt="" className="w-3 h-3" />{item.price}</>}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="inline-flex items-center gap-2 mb-4 bg-card/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
        <Trophy size={18} className="text-primary" />
        <h2 className="text-base font-pixel text-card-foreground">Item Collection</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {regularItems.map((item) => (
          <div key={item.id} className={`cozy-card p-3 relative transition-all duration-200 group border-2 ${rarityBorderColors[item.rarity] || "border-gray-400/60"} hover:-translate-y-1 hover:shadow-md ${item.unlocked ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background shadow-lg shadow-green-500/20" : ""}`}>
            {!item.unlocked && <div className="absolute top-2 right-2 z-10"><Lock className="w-4 h-4 text-muted-foreground" /></div>}
            {item.isSpecialReward && <div className="absolute top-2 left-2 z-10"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div>}
            <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
              <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-contain transition-all duration-200 ${!item.unlocked ? "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0" : ""}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
            <h3 className="font-pixel text-[9px] truncate mb-1 text-foreground" title={item.name}>{item.name}</h3>
            <p className={`text-[8px] capitalize font-semibold ${rarityTextColors[item.rarity] || "text-gray-400"}`}>{item.rarity}</p>
            {item.isSpecialReward && item.specialRewardCondition && (
              <p className="text-[7px] text-amber-600 mt-1 truncate" title={item.specialRewardCondition}>{item.specialRewardCondition}</p>
            )}
          </div>
        ))}
      </div>

      {allItems.length === 0 && (
        <div className="cozy-card flex flex-col items-center justify-center h-64">
          <Trophy className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
          <p className="font-pixel text-sm text-muted-foreground">No Items Available</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later!</p>
        </div>
      )}
    </main>
  );
}
