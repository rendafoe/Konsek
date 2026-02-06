"use client";

import { useMedalStatus, useCheckIn } from "@/hooks/use-medals";
import { MedalRewardModal } from "./MedalRewardModal";
import { useState } from "react";
import { Flame, Check, Loader2 } from "lucide-react";

export function DailyCheckInBox() {
  const { data: status, isLoading, isError } = useMedalStatus();
  const { mutate: checkIn, isPending } = useCheckIn();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    medalsAwarded: number;
    currentStreak: number;
    isStreakBonus: boolean;
    newBalance: number;
  } | null>(null);

  const handleCheckIn = () => {
    checkIn(undefined, {
      onSuccess: (data) => {
        setModalData({
          medalsAwarded: data.medalsAwarded,
          currentStreak: data.currentStreak,
          isStreakBonus: data.isStreakBonus,
          newBalance: data.newBalance,
        });
        setModalOpen(true);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-b-4 border-yellow-400/30">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="animate-spin text-yellow-500" />
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-b-4 border-yellow-400/30">
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <span className="text-sm">Daily check-in unavailable</span>
        </div>
      </div>
    );
  }

  const { canCheckIn, currentStreak, daysUntilBonus } = status;

  // Calculate streak progress (0-3)
  const streakProgress = currentStreak % 3;
  const progressBoxes = [
    streakProgress >= 1,
    streakProgress >= 2,
    streakProgress === 0 && currentStreak > 0, // Third box is filled right before bonus
  ];

  // If we just checked in today and haven't hit a bonus, show progress correctly
  // When streakProgress is 0 and we can't check in, we either just got bonus or streak is 0
  const displayProgress = canCheckIn
    ? [streakProgress >= 1, streakProgress >= 2, false]
    : streakProgress === 0
      ? [true, true, true] // Just got bonus or starting fresh
      : [streakProgress >= 1, streakProgress >= 2, false];

  return (
    <>
      {/* Medal Reward Modal */}
      {modalData && (
        <MedalRewardModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          {...modalData}
        />
      )}

      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-b-4 border-yellow-400/30">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Check-in button or status */}
          <div className="flex items-center gap-3">
            {canCheckIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-yellow-400/30"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <img src="/items/medal.png" alt="" className="w-5 h-5" />
                )}
                Check In
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl font-semibold text-sm">
                <Check size={16} />
                Checked In
              </div>
            )}
          </div>

          {/* Center: Streak Display */}
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            <span className="font-bold text-lg">{currentStreak}</span>
            <span className="text-sm text-muted-foreground">day streak</span>
          </div>

          {/* Right: Progress to bonus */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => {
                // Calculate if this box should be filled
                const filled = !canCheckIn && currentStreak > 0
                  ? (currentStreak % 3 === 0 ? true : i < (currentStreak % 3))
                  : i < streakProgress;

                return (
                  <div
                    key={i}
                    className={`
                      w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                      ${filled
                        ? 'bg-orange-500 border-orange-600'
                        : 'bg-gray-100 border-gray-200'
                      }
                    `}
                  >
                    {filled && <Flame className="w-3 h-3 text-white" />}
                  </div>
                );
              })}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {daysUntilBonus === 0 || (currentStreak % 3 === 0 && currentStreak > 0 && !canCheckIn)
                ? 'Bonus day!'
                : `${daysUntilBonus} to bonus`
              }
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
