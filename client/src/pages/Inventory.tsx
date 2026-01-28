import { useInventory, useEquipItem, useUnequipItem } from "@/hooks/use-inventory";
import { Navigation } from "@/components/Navigation";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Inventory() {
  const { data: items, isLoading } = useInventory();
  const { mutate: equip } = useEquipItem();
  const { mutate: unequip } = useUnequipItem();
  const { toast } = useToast();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const handleToggleEquip = (inventoryItem: any) => {
    if (inventoryItem.equipped) {
      unequip(inventoryItem.id, {
        onSuccess: () => toast({ title: "Unequipped", description: `Removed ${inventoryItem.item.name}` })
      });
    } else {
      equip(inventoryItem.id, {
        onSuccess: () => toast({ title: "Equipped", description: `Equipped ${inventoryItem.item.name}` })
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

        {items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-border rounded-lg bg-card/50">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="font-pixel text-sm text-muted-foreground">No Items Found</p>
            <p className="text-xs text-muted-foreground mt-2">Go for a run to find loot!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {items?.map((invItem) => (
              <div 
                key={invItem.id} 
                className={`
                  bg-card p-4 pixel-border relative group cursor-pointer transition-all hover:-translate-y-1
                  ${invItem.equipped ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}
                `}
                onClick={() => handleToggleEquip(invItem)}
              >
                {/* Rarity Indicator */}
                <div className={`
                  absolute top-2 right-2 w-2 h-2 rounded-full
                  ${invItem.item.rarity === 'legendary' ? 'bg-yellow-500' : 
                    invItem.item.rarity === 'epic' ? 'bg-purple-500' :
                    invItem.item.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-400'}
                `} />

                <div className="aspect-square bg-background border-2 border-border mb-4 flex items-center justify-center">
                  {/* Placeholder Pixel Art for Item */}
                  <Shield className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                
                <h3 className="font-pixel text-[10px] truncate mb-1">{invItem.item.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate">{invItem.item.type}</p>
                
                {invItem.equipped && (
                  <div className="absolute top-2 left-2 bg-primary text-[8px] font-pixel text-primary-foreground px-1 py-0.5">
                    EQP
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
