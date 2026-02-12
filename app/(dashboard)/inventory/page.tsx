"use client";

import { useMemo } from "react";
import { useInventory, useEquipItem, useUnequipItem } from "@/hooks/use-inventory";
import { PageHeader } from "@/components/PageHeader";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageBackground } from "@/components/PageBackground";

const rarityTextColors: Record<string, string> = {
  common: "text-gray-500",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
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
  const { mutate: equip } = useEquipItem();
  const { mutate: unequip } = useUnequipItem();
  const { toast } = useToast();

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
    return Array.from(groups.values());
  }, [items]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const handleToggleEquip = (groupedItem: GroupedItem) => {
    if (groupedItem.equippedId) {
      unequip(groupedItem.equippedId, {
        onSuccess: () => toast({ title: "Unequipped", description: `Removed ${groupedItem.item.name}` })
      });
    } else {
      equip(groupedItem.firstInventoryId, {
        onSuccess: () => toast({ title: "Equipped", description: `Equipped ${groupedItem.item.name}` })
      });
    }
  };

  return (
    <PageBackground src="/backgrounds/gear.webp" overlay={0.25}>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <PageHeader title="Gear Stash" subtitle="Items collected from your journeys" />

        {groupedItems.length === 0 ? (
          <div className="cozy-card flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
            <p className="font-pixel text-sm text-muted-foreground">No Items Found</p>
            <p className="text-xs text-muted-foreground mt-1">Go for a run to find loot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groupedItems.map((groupedItem) => (
              <div
                key={groupedItem.itemId}
                className={`cozy-card p-3 relative group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${groupedItem.equippedId ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                onClick={() => handleToggleEquip(groupedItem)}
              >
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${groupedItem.item?.rarity === 'legendary' ? 'bg-yellow-500' : groupedItem.item?.rarity === 'epic' ? 'bg-purple-500' : groupedItem.item?.rarity === 'rare' ? 'bg-blue-500' : groupedItem.item?.rarity === 'uncommon' ? 'bg-green-500' : 'bg-gray-400'}`} />

                <div className="aspect-square bg-muted/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {groupedItem.item?.imageUrl ? (
                    <img src={groupedItem.item.imageUrl} alt={groupedItem.item.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                  ) : null}
                  <Shield className={`w-8 h-8 text-muted-foreground opacity-50 ${groupedItem.item?.imageUrl ? 'hidden' : ''}`} />
                </div>

                <h3 className="font-pixel text-[10px] truncate mb-0.5">{groupedItem.item?.name}</h3>
                <p className={`text-[8px] capitalize font-semibold mb-1 ${rarityTextColors[groupedItem.item?.rarity] || "text-gray-400"}`}>{groupedItem.item?.rarity}</p>
                <p className="text-[9px] text-muted-foreground italic truncate">{groupedItem.item?.quote ? `"${groupedItem.item.quote}"` : "A mysterious item..."}</p>

                {groupedItem.equippedId && (
                  <div className="absolute top-2 left-2 bg-primary text-[8px] font-pixel text-primary-foreground px-1.5 py-0.5 rounded">EQP</div>
                )}
                {groupedItem.count > 1 && (
                  <div className="absolute bottom-2 right-2 bg-muted text-[10px] font-bold text-foreground px-1.5 py-0.5 rounded min-w-[20px] text-center">x{groupedItem.count}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </PageBackground>
  );
}
