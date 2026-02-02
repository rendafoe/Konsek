import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface AwardedItem {
  id: number;
  name: string;
  description: string;
  rarity: string;
  imageUrl: string;
  quote: string | null;
  isSpecialReward: boolean;
  specialRewardCondition: string | null;
}

interface ItemRewardModalProps {
  items: AwardedItem[];
  medalsAwarded?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rarityColors: Record<string, string> = {
  common: "from-gray-400 to-gray-500",
  uncommon: "from-green-400 to-green-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-amber-500",
};

const rarityBgColors: Record<string, string> = {
  common: "bg-gray-100 border-gray-300",
  uncommon: "bg-green-50 border-green-300",
  rare: "bg-blue-50 border-blue-300",
  epic: "bg-purple-50 border-purple-300",
  legendary: "bg-yellow-50 border-yellow-300",
};

const rarityTextColors: Record<string, string> = {
  common: "text-gray-600",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-yellow-600",
};

export function ItemRewardModal({ items, medalsAwarded = 0, open, onOpenChange }: ItemRewardModalProps) {
  if (items.length === 0 && medalsAwarded === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <span className="text-xl">Items Found!</span>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {items.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className={`
                flex items-center gap-4 p-4 rounded-xl border-2
                ${rarityBgColors[item.rarity] || rarityBgColors.common}
                animate-in fade-in slide-in-from-bottom-2 duration-300
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Item Image */}
              <div className={`
                w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0
                bg-gradient-to-br ${rarityColors[item.rarity] || rarityColors.common}
                p-0.5
              `}>
                <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                <p className={`text-sm font-semibold capitalize ${rarityTextColors[item.rarity] || rarityTextColors.common}`}>
                  {item.rarity}
                  {item.isSpecialReward && " ★"}
                </p>
                {item.quote && (
                  <p className="text-xs text-muted-foreground italic mt-1 truncate">
                    "{item.quote}"
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Medal Reward Section */}
          {medalsAwarded > 0 && (
            <div
              className="flex items-center gap-4 p-4 rounded-xl border-2 bg-yellow-50 border-yellow-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${items.length * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-yellow-300 to-amber-400 p-0.5">
                <div className="w-full h-full bg-white rounded-md flex items-center justify-center">
                  <img
                    src="/items/medal.png"
                    alt="Medal"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-700">+{medalsAwarded} Medals earned!</h3>
                <p className="text-sm text-yellow-600">From item drops</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:brightness-110 transition-all"
          >
            Awesome!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
