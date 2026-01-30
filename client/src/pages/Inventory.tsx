import { useMemo } from "react";
import { useInventory, useEquipItem, useUnequipItem } from "@/hooks/use-inventory";
import { Navigation } from "@/components/Navigation";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupedItem {
  itemId: number;
  item: any;
  count: number;
  equippedId: number | null; // ID of the equipped instance, if any
  firstInventoryId: number; // For equipping/unequipping
}

export default function Inventory() {
  const { data: items, isLoading } = useInventory();
  const { mutate: equip } = useEquipItem();
  const { mutate: unequip } = useUnequipItem();
  const { toast } = useToast();

  // Group items by itemId and count duplicates
  const groupedItems = useMemo(() => {
    if (!items) return [];

    const groups = new Map<number, GroupedItem>();

    for (const invItem of items) {
      const existing = groups.get(invItem.itemId);
      if (existing) {
        existing.count++;
        if (invItem.equipped) {
          existing.equippedId = invItem.id;
        }
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-ui">
      <Navigation />

      <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-2xl md:text-3xl font-pixel text-foreground mb-2">Gear Stash</h1>
          <p className="text-muted-foreground">Items collected from your journeys.</p>
        </header>

        {groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-pixel text-sm text-muted-foreground">No Items Found</p>
            <p className="text-xs text-muted-foreground mt-2">Go for a run to find loot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {groupedItems.map((groupedItem) => (
              <div
                key={groupedItem.itemId}
                className={`
                  bg-card p-4 pixel-border relative group cursor-pointer transition-all hover:-translate-y-1
                  ${groupedItem.equippedId ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}
                onClick={() => handleToggleEquip(groupedItem)}
              >
                {/* Rarity Indicator */}
                <div className={`
                  absolute top-2 right-2 w-2 h-2 rounded-full
                  ${groupedItem.item?.rarity === 'legendary' ? 'bg-yellow-500' :
                    groupedItem.item?.rarity === 'epic' ? 'bg-purple-500' :
                    groupedItem.item?.rarity === 'rare' ? 'bg-blue-500' :
                    groupedItem.item?.rarity === 'uncommon' ? 'bg-green-500' : 'bg-gray-400'}
                `} />

                <div className="aspect-square bg-background border-2 border-border mb-3 flex items-center justify-center overflow-hidden">
                  {groupedItem.item?.imageUrl ? (
                    <img
                      src={groupedItem.item.imageUrl}
                      alt={groupedItem.item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Shield className={`w-8 h-8 text-muted-foreground opacity-50 ${groupedItem.item?.imageUrl ? 'hidden' : ''}`} />
                </div>

                <h3 className="font-pixel text-[10px] truncate mb-1">{groupedItem.item?.name}</h3>
                <p className="text-[9px] text-muted-foreground italic truncate">
                  {groupedItem.item?.quote ? `"${groupedItem.item.quote}"` : "A mysterious item..."}
                </p>

                {groupedItem.equippedId && (
                  <div className="absolute top-2 left-2 bg-primary text-[8px] font-pixel text-primary-foreground px-1 py-0.5">
                    EQP
                  </div>
                )}

                {/* Item count badge */}
                {groupedItem.count > 1 && (
                  <div className="absolute bottom-2 right-2 bg-muted text-[10px] font-bold text-foreground px-1.5 py-0.5 rounded-sm min-w-[20px] text-center">
                    x{groupedItem.count}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
