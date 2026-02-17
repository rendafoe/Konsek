"use client";

import { useMedalStatus, useCheckIn } from "@/hooks/use-medals";
import { MedalRewardModal } from "./MedalRewardModal";
import { useHaptics } from "@/hooks/use-haptics";
import { useState } from "react";
import { Flame, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Up late?";
  if (hour < 12) return "Good morning!";
  if (hour < 17) return "Good afternoon!";
  if (hour < 21) return "Good evening!";
  return "Night owl!";
}

interface DailyCheckInBoxProps {
  variant?: "default" | "cozy";
}

export function DailyCheckInBox({ variant = "default" }: DailyCheckInBoxProps) {
  const { data: status, isLoading, isError } = useMedalStatus();
  const { mutate: checkIn, isPending } = useCheckIn();
  const { playWithVibrate } = useHaptics();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    medalsAwarded: number;
    currentStreak: number;
    isStreakBonus: boolean;
    newBalance: number;
  } | null>(null);

  const handleCheckIn = () => {
    playWithVibrate("tap");
    checkIn(undefined, {
      onSuccess: (data) => {
        setModalData({
          medalsAwarded: data.medalsAwarded,
          currentStreak: data.currentStreak,
          isStreakBonus: data.isStreakBonus,
          newBalance: data.newBalance,
        });
        playWithVibrate("reward");
        setModalOpen(true);
      },
    });
  };

  if (isLoading) {
    return variant === "cozy" ? (
      <div className="flex justify-center">
        <div className="checkin-glass rounded-2xl px-5 py-3.5 w-full max-w-sm md:max-w-md flex items-center justify-center h-12">
          <Loader2 size={16} className="animate-spin text-white/50" />
        </div>
      </div>
    ) : (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-b-4 border-yellow-400/30">
        <div className="flex items-center justify-center h-20">
          <Loader2 className="animate-spin text-yellow-500" />
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return variant === "cozy" ? (
      <div className="flex justify-center">
        <div className="checkin-glass rounded-2xl px-5 py-3.5 w-full max-w-sm md:max-w-md flex items-center justify-center h-12">
          <span className="text-xs text-white/40">Check-in unavailable</span>
        </div>
      </div>
    ) : (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-b-4 border-yellow-400/30">
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <span className="text-sm">Daily check-in unavailable</span>
        </div>
      </div>
    );
  }

  const { canCheckIn, currentStreak, daysUntilBonus } = status;
  const streakProgress = currentStreak % 3;

  // Cozy variant — compact glassmorphic overlay
  if (variant === "cozy") {
    return (
      <>
        {modalData && (
          <MedalRewardModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            {...modalData}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex justify-center"
        >
          <div className="checkin-glass rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 w-full max-w-sm md:max-w-md">
            {/* Single row: button/status | streak | bonus pips */}
            <div className="flex items-center justify-between gap-3">
              {/* Left: Check-in action */}
              <div className="flex items-center gap-2 shrink-0">
                {canCheckIn ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 shadow-md checkin-glow"
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <img src="/items/medal.png" alt="" className="w-4 h-4" />
                    )}
                    <span className="hidden xs:inline">Check In</span>
                    <span className="xs:hidden">Check In</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-green-300">
                    <Check size={14} />
                    <span>Done!</span>
                  </div>
                )}
              </div>

              {/* Center: Streak */}
              <div className="flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${currentStreak > 0 ? "text-orange-400" : "text-white/30"}`} />
                <span className="font-bold text-sm text-white/90">{currentStreak}</span>
                <span className="text-[10px] text-white/50 hidden sm:inline">streak</span>
              </div>

              {/* Right: Bonus progress pips */}
              <div className="flex items-center gap-1 shrink-0">
                {[0, 1, 2].map((i) => {
                  const filled = !canCheckIn && currentStreak > 0
                    ? (currentStreak % 3 === 0 ? true : i < (currentStreak % 3))
                    : i < streakProgress;

                  return (
                    <div
                      key={i}
                      className={`
                        w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[5px] border flex items-center justify-center transition-all
                        ${filled
                          ? "bg-orange-500/90 border-orange-400/60"
                          : "bg-white/10 border-white/20"
                        }
                      `}
                    >
                      {filled && <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />}
                    </div>
                  );
                })}
                <span className="text-[9px] sm:text-[10px] text-white/40 ml-1">
                  {daysUntilBonus === 0 || (currentStreak % 3 === 0 && currentStreak > 0 && !canCheckIn)
                    ? "Bonus!"
                    : `${daysUntilBonus} to go`
                  }
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Default variant (original)
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
