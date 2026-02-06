"use client";

import { useAchievements } from "@/hooks/use-achievements";
import { useMedalStatus, usePurchaseItem } from "@/hooks/use-medals";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Trophy, Lock, Star, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const rarityColors: Record<string, string> = {
  common: "border-gray-400",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
  mythic: "border-transparent",
};

const rarityTextColors: Record<string, string> = {
  common: "text-gray-500",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
  mythic: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500",
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
    <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
      <PageHeader title="Achievements" subtitle={`Collect all items from your running adventures. ${unlockedCount} / ${totalCount} unlocked`} />

      {mythicItems.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles size={24} className="text-yellow-500" />
            <h2 className="text-xl font-pixel text-foreground">Mythic Collection</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mythicItems.map((item) => (
              <div key={item.id} className={`bg-card p-3 pixel-border relative transition-all duration-200 group ${item.unlocked ? "ring-4 ring-green-500 ring-offset-2 ring-offset-background shadow-xl shadow-green-500/40" : "hover:-translate-y-1 hover:shadow-lg"}`}
                style={{ background: item.unlocked ? undefined : "linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,105,180,0.1) 50%, rgba(138,43,226,0.1) 100%)", borderImage: "linear-gradient(135deg, #ffd700, #ff69b4, #8b2be2, #ffd700) 1" }}>
                {!item.unlocked && <div className="absolute top-2 right-2 z-10"><Lock className="w-4 h-4 text-purple-400" /></div>}
                <div className="absolute top-2 left-2 z-10"><Sparkles className="w-4 h-4 text-yellow-400" /></div>
                <div className="aspect-square bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 border-2 border-yellow-200 mb-2 flex items-center justify-center overflow-hidden rounded">
                  <img src={item.imageUrl} alt={item.name} className={`w-full h-full object-contain transition-all duration-200 ${!item.unlocked ? "opacity-60 grayscale-[50%] group-hover:opacity-100 group-hover:grayscale-0" : ""}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                </div>
                <h3 className="font-pixel text-[9px] truncate mb-1 text-foreground" title={item.name}>{item.name}</h3>
                <p className={`text-[8px] capitalize font-bold ${rarityTextColors[item.rarity]}`}>{item.rarity}</p>
                {item.unlocked ? (
                  <div className="mt-2 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded text-center">Owned</div>
                ) : item.price ? (
                  <button onClick={() => handlePurchase(item.id, item.name, item.price!)} disabled={isPurchasing && purchasingItemId === item.id}
                    className={`mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded transition-all ${medalStatus && medalStatus.balance >= item.price ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:brightness-110 cursor-pointer" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}>
                    {isPurchasing && purchasingItemId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><img src="/items/medal.png" alt="" className="w-3 h-3" />{item.price}</>}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-primary" />
        <h2 className="text-xl font-pixel text-foreground">Item Collection</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {regularItems.map((item) => (
          <div key={item.id} className={`bg-card p-3 pixel-border relative transition-all duration-200 group border-2 ${rarityColors[item.rarity] || "border-gray-400"} ${item.unlocked ? "ring-4 ring-green-500 ring-offset-2 ring-offset-background shadow-xl shadow-green-500/40" : "hover:-translate-y-1 hover:shadow-lg"}`}>
            {!item.unlocked && <div className="absolute top-2 right-2 z-10"><Lock className="w-4 h-4 text-muted-foreground" /></div>}
            {item.isSpecialReward && <div className="absolute top-2 left-2 z-10"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /></div>}
            <div className="aspect-square bg-background border-2 border-border mb-2 flex items-center justify-center overflow-hidden">
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
        <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
          <Trophy className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <p className="font-pixel text-sm text-muted-foreground">No Items Available</p>
          <p className="text-xs text-muted-foreground mt-2">Check back later!</p>
        </div>
      )}
    </main>
  );
}
