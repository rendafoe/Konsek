"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Flame } from "lucide-react";

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
  const isHighRoll = medalsAwarded >= 8;

  const dismiss = () => onOpenChange(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />

          {/* Card */}
          <motion.div
            className="relative z-10 flex items-center justify-center cursor-pointer"
            onClick={dismiss}
            initial={{ scale: 0.85, opacity: 0, rotateY: -30, x: -60 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
          >
            <div className="flex flex-col items-center w-full">
              <div
                className="relative w-[260px] rounded-2xl overflow-hidden"
                style={{
                  background: isStreakBonus
                    ? "linear-gradient(145deg, #fff7ed 0%, #fed7aa 40%, #f97316 100%)"
                    : "linear-gradient(145deg, #fef9c3 0%, #fde68a 40%, #f59e0b 100%)",
                  border: `3px solid ${isStreakBonus ? "#f97316" : "#f59e0b"}`,
                  boxShadow: isStreakBonus
                    ? "0 0 28px rgba(249,115,22,0.4), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)"
                    : "0 0 28px rgba(245,158,11,0.4), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
                }}
              >
                {/* Top bar */}
                <div
                  className="h-2 w-full"
                  style={{
                    background: isStreakBonus
                      ? "linear-gradient(180deg, #fdba74 0%, #f97316 100%)"
                      : "linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)",
                  }}
                />

                {/* Inner frame */}
                <div
                  className="absolute inset-[6px] rounded-xl pointer-events-none"
                  style={{ border: `1.5px solid ${isStreakBonus ? "rgba(249,115,22,0.3)" : "rgba(245,158,11,0.3)"}` }}
                />

                {/* Content */}
                <div className="px-5 pt-6 pb-4 flex flex-col items-center">
                  {/* Title */}
                  <motion.p
                    className={`text-xs font-bold tracking-wider uppercase mb-4 ${isStreakBonus ? "text-orange-800" : "text-amber-800"}`}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {isStreakBonus ? (
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        Streak Bonus
                        <Flame className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      "Daily Check-In"
                    )}
                  </motion.p>

                  {/* Medal image */}
                  <motion.div
                    className="relative w-[100px] h-[100px] flex items-center justify-center"
                    initial={{ rotateY: -180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 12 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${isStreakBonus ? "rgba(249,115,22,0.3)" : "rgba(245,158,11,0.3)"} 0%, transparent 70%)`,
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <img
                      src="/items/medal.png"
                      alt="Medal"
                      className="w-20 h-20 object-contain drop-shadow-lg relative z-10"
                    />
                  </motion.div>

                  {/* Medal count */}
                  <motion.div
                    className="mt-4 text-center"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <p
                      className={`font-bold ${isStreakBonus ? "text-orange-900" : "text-amber-900"}`}
                      style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "18px" }}
                    >
                      +{medalsAwarded}
                    </p>
                    <p className={`text-sm font-semibold mt-1 ${isStreakBonus ? "text-orange-800" : "text-amber-800"}`}>
                      {medalsAwarded === 1 ? "Medal" : "Medals"} Earned
                    </p>
                  </motion.div>

                  {/* Streak info */}
                  {currentStreak > 0 && (
                    <motion.div
                      className={`mt-3 flex items-center gap-1.5 text-xs ${isStreakBonus ? "text-orange-700" : "text-amber-700/70"}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{currentStreak} day streak</span>
                    </motion.div>
                  )}

                  {/* High roll celebration */}
                  {isHighRoll && (
                    <motion.div
                      className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="font-semibold">Amazing roll!</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </motion.div>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 px-5">
                  <div className={`flex-1 h-px ${isStreakBonus ? "bg-orange-500/30" : "bg-amber-500/30"}`} />
                  <div className={`w-2 h-2 rotate-45 ${isStreakBonus ? "bg-orange-500" : "bg-amber-500"}`} />
                  <div className={`flex-1 h-px ${isStreakBonus ? "bg-orange-500/30" : "bg-amber-500/30"}`} />
                </div>

                {/* Balance */}
                <motion.p
                  className={`text-center text-xs py-3 ${isStreakBonus ? "text-orange-700/60" : "text-amber-700/60"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Total: <span className="font-semibold">{newBalance} Medals</span>
                </motion.p>

                {/* Bottom bar */}
                <div
                  className="h-2 w-full"
                  style={{
                    background: isStreakBonus
                      ? "linear-gradient(180deg, #fdba74 0%, #f97316 100%)"
                      : "linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)",
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Dismiss button */}
          <motion.div
            className="relative z-10 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              className="px-6 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-full text-sm font-semibold backdrop-blur-sm transition-all active:scale-95"
            >
              {isStreakBonus ? "Awesome!" : "Nice!"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
