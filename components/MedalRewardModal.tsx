"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Flame, Trophy } from "lucide-react";

interface MedalRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medalsAwarded: number;
  currentStreak: number;
  isStreakBonus: boolean;
  newBalance: number;
}

export function MedalRewardModal({
  open,
  onOpenChange,
  medalsAwarded,
  currentStreak,
  isStreakBonus,
  newBalance,
}: MedalRewardModalProps) {
  // Determine if this is a high roll (8-10 medals)
  const isHighRoll = medalsAwarded >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            {isStreakBonus ? (
              <>
                <Flame className="w-6 h-6 text-orange-500" />
                <span className="text-xl">Streak Bonus!</span>
                <Flame className="w-6 h-6 text-orange-500" />
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-xl">Daily Check-In</span>
                <Trophy className="w-6 h-6 text-yellow-500" />
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-6">
          {/* Medal Display */}
          <div className={`
            relative flex flex-col items-center
            ${isHighRoll ? 'animate-pulse' : ''}
          `}>
            {/* Glow effect for high rolls */}
            {isHighRoll && (
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-ping" />
            )}

            {/* Medal Image */}
            <div className={`
              relative w-24 h-24 rounded-full overflow-hidden border-4
              ${isStreakBonus ? 'border-orange-400 shadow-lg shadow-orange-400/50' : 'border-yellow-400 shadow-lg shadow-yellow-400/50'}
              animate-in zoom-in duration-500
            `}>
              <img
                src="/items/medal.png"
                alt="Medal"
                className="w-full h-full object-contain bg-gradient-to-br from-yellow-100 to-yellow-200"
              />
            </div>

            {/* Medal Count */}
            <div className={`
              mt-4 text-4xl font-bold
              ${isStreakBonus ? 'text-orange-600' : 'text-yellow-600'}
              animate-in slide-in-from-bottom duration-300 delay-200
            `}>
              +{medalsAwarded}
            </div>
            <div className="text-sm text-muted-foreground">
              {medalsAwarded === 1 ? 'Medal' : 'Medals'} earned
            </div>
          </div>

          {/* Streak Info */}
          {isStreakBonus && (
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-full animate-in fade-in duration-500 delay-300">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">Day {currentStreak} Streak!</span>
              <Flame className="w-5 h-5" />
            </div>
          )}

          {!isStreakBonus && currentStreak > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flame className="w-4 h-4" />
              <span className="text-sm">{currentStreak} day streak</span>
            </div>
          )}

          {/* High roll celebration */}
          {isHighRoll && (
            <div className="flex items-center gap-2 text-yellow-600 animate-bounce">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Amazing roll!</span>
              <Sparkles className="w-5 h-5" />
            </div>
          )}

          {/* New Balance */}
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{newBalance} Medals</span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onOpenChange(false)}
            className={`
              px-6 py-2 rounded-lg font-semibold transition-all
              ${isStreakBonus
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110'
                : 'bg-primary text-white hover:brightness-110'
              }
            `}
          >
            {isStreakBonus ? 'Awesome!' : 'Nice!'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
