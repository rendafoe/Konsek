"use client";

import { useMemo, useState } from "react";
import { useInventory } from "@/hooks/use-inventory";
import { useHaptics } from "@/hooks/use-haptics";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { PageBackground } from "@/components/PageBackground";
import { ItemCardFlipOverlay } from "@/components/ItemCardFlipOverlay";

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
  mythic: "border-yellow-500/70",
};

interface GroupedItem {
  itemId: number;
  item: any;
  count: number;
  equippedId: number | null;
  firstInventoryId: number;
}

export default function Inventory() {
  const { data: items, isLoading } = useInventory();
  const { playWithVibrate } = useHaptics();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const groupedItems = useMemo(() => {
    if (!items) return [];
    const groups = new Map<number, GroupedItem>();
    for (const invItem of items) {
      const existing = groups.get(invItem.itemId);
      if (existing) {
        existing.count++;
        if (invItem.equipped) existing.equippedId = invItem.id;
      } else {
        groups.set(invItem.itemId, {
          itemId: invItem.itemId,
          item: invItem.item,
          count: 1,
          equippedId: invItem.equipped ? invItem.id : null,
          firstInventoryId: invItem.id,
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) => {
      const nameA = a.item?.name ?? "";
      const nameB = b.item?.name ?? "";
      const aIsNumeric = /^\d/.test(nameA);
      const bIsNumeric = /^\d/.test(nameB);
      if (aIsNumeric !== bIsNumeric) return aIsNumeric ? 1 : -1;
      return nameA.localeCompare(nameB);
    });
  }, [items]);

  const selectedItem = useMemo(() => {
    if (selectedItemId === null) return null;
    return groupedItems.find((g) => g.itemId === selectedItemId) ?? null;
  }, [selectedItemId, groupedItems]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <PageBackground src="/backgrounds/gear.webp" overlay={0.25}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">

        {groupedItems.length === 0 ? (
          <div className="cozy-card flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="font-pixel text-sm text-muted-foreground">No Items Found</p>
            <p className="text-xs text-muted-foreground mt-1">Go for a run to find loot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
            {groupedItems.map((groupedItem) => (
              <div
                key={groupedItem.itemId}
                className={`cozy-card p-2 relative group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md border-2 ${rarityBorderColors[groupedItem.item?.rarity] || "border-gray-400/60"} ${groupedItem.equippedId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => {
                  playWithVibrate("tap", "tap");
                  setSelectedItemId(groupedItem.itemId);
                }}
              >
                <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${groupedItem.item?.rarity === 'legendary' ? 'bg-yellow-500' : groupedItem.item?.rarity === 'epic' ? 'bg-purple-500' : groupedItem.item?.rarity === 'rare' ? 'bg-blue-500' : groupedItem.item?.rarity === 'uncommon' ? 'bg-green-500' : 'bg-gray-400'}`} />

                <div className="aspect-square bg-muted/30 rounded-lg mb-1 flex items-center justify-center overflow-hidden">
                  {groupedItem.item?.imageUrl ? (
                    <img src={groupedItem.item.imageUrl} alt={groupedItem.item.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                  ) : null}
                  <Shield className={`w-8 h-8 text-muted-foreground opacity-50 ${groupedItem.item?.imageUrl ? 'hidden' : ''}`} />
                </div>

                <h3 className={`font-pixel leading-tight break-words mb-0.5 ${(groupedItem.item?.name?.split(/\s+/) ?? []).some((w: string) => w.length > 10) ? 'text-[6px]' : 'text-[8px]'}`}>{groupedItem.item?.name}</h3>
                <p className={`text-[8px] capitalize font-semibold ${rarityTextColors[groupedItem.item?.rarity] || "text-gray-400"}`}>{groupedItem.item?.rarity}</p>

                {groupedItem.equippedId && (
                  <div className="absolute top-1.5 left-1.5 bg-primary text-[7px] font-pixel text-primary-foreground px-1 py-0.5 rounded">EQP</div>
                )}
                {groupedItem.count > 1 && (
                  <div className="absolute bottom-1.5 right-1.5 bg-muted text-[8px] font-bold text-foreground px-1 py-0.5 rounded min-w-[16px] text-center">x{groupedItem.count}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedItem && (
        <ItemCardFlipOverlay
          item={{
            itemId: selectedItem.itemId,
            name: selectedItem.item?.name ?? "Unknown",
            rarity: selectedItem.item?.rarity ?? "common",
            imageUrl: selectedItem.item?.imageUrl ?? "",
            quote: selectedItem.item?.quote ?? null,
            equippedId: selectedItem.equippedId,
          }}
          open={selectedItemId !== null}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </PageBackground>
  );
}
