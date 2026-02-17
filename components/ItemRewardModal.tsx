"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { useHaptics } from "@/hooks/use-haptics";

interface AwardedItem {
  id: number;
  name: string;
  description: string;
  rarity: string;
  imageUrl: string;
  quote: string | null;
  isSpecialReward: boolean;
  specialRewardCondition: string | null;
  isNew?: boolean;
}

interface ProgressionReward {
  stage: string;
  medalsAwarded: number;
}

interface ItemRewardModalProps {
  items: AwardedItem[];
  medalsAwarded?: number;
  progressionReward?: ProgressionReward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RewardCard =
  | { type: "item"; data: AwardedItem }
  | { type: "medals"; data: { amount: number } }
  | { type: "evolution"; data: ProgressionReward };

// --- Rarity color maps ---

const rarityColors: Record<string, { border: string; glow: string; bg: string; accent: string; badge: string; badgeText: string; frame: string }> = {
  common: {
    border: "#9ca3af",
    glow: "rgba(156,163,175,0.4)",
    bg: "linear-gradient(145deg, #e5e7eb 0%, #d1d5db 50%, #c8ccd2 100%)",
    accent: "#6b7280",
    badge: "#e5e7eb",
    badgeText: "#374151",
    frame: "linear-gradient(180deg, #c8ccd2 0%, #9ca3af 100%)",
  },
  uncommon: {
    border: "#4ade80",
    glow: "rgba(74,222,128,0.4)",
    bg: "linear-gradient(145deg, #dcfce7 0%, #bbf7d0 50%, #a7f3d0 100%)",
    accent: "#16a34a",
    badge: "#dcfce7",
    badgeText: "#15803d",
    frame: "linear-gradient(180deg, #86efac 0%, #4ade80 100%)",
  },
  rare: {
    border: "#60a5fa",
    glow: "rgba(96,165,250,0.5)",
    bg: "linear-gradient(145deg, #dbeafe 0%, #bfdbfe 50%, #a5c8f7 100%)",
    accent: "#2563eb",
    badge: "#dbeafe",
    badgeText: "#1d4ed8",
    frame: "linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)",
  },
  epic: {
    border: "#c084fc",
    glow: "rgba(192,132,252,0.5)",
    bg: "linear-gradient(145deg, #f3e8ff 0%, #e9d5ff 50%, #ddd6fe 100%)",
    accent: "#9333ea",
    badge: "#f3e8ff",
    badgeText: "#7e22ce",
    frame: "linear-gradient(180deg, #d8b4fe 0%, #c084fc 100%)",
  },
  legendary: {
    border: "#fbbf24",
    glow: "rgba(250,204,21,0.6)",
    bg: "linear-gradient(145deg, #fef9c3 0%, #fde68a 50%, #fcd34d 100%)",
    accent: "#d97706",
    badge: "#fef3c7",
    badgeText: "#92400e",
    frame: "linear-gradient(180deg, #fde68a 0%, #fbbf24 100%)",
  },
  mythic: {
    border: "#fb7185",
    glow: "rgba(251,113,133,0.6)",
    bg: "linear-gradient(145deg, #ffe4e6 0%, #fecdd3 50%, #fda4af 100%)",
    accent: "#e11d48",
    badge: "#ffe4e6",
    badgeText: "#be123c",
    frame: "linear-gradient(180deg, #fda4af 0%, #fb7185 100%)",
  },
};

function getRarityColors(rarity: string) {
  return rarityColors[rarity] || rarityColors.common;
}

// --- Card components ---

function ItemCard({ item }: { item: AwardedItem }) {
  const colors = getRarityColors(item.rarity);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Card frame */}
      <div
        className="relative w-[260px] rounded-2xl overflow-hidden"
        style={{
          background: colors.bg,
          border: `3px solid ${colors.border}`,
          boxShadow: `0 0 24px ${colors.glow}, 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.5)`,
        }}
      >
        {/* Inner frame border */}
        <div
          className="absolute inset-[6px] rounded-xl pointer-events-none"
          style={{
            border: `1.5px solid ${colors.border}40`,
          }}
        />

        {/* New! badge */}
        {item.isNew && (
          <motion.div
            className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
            }}
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
          >
            <span
              className="text-[8px] font-bold text-amber-900 uppercase tracking-wider"
              style={{ fontFamily: "'Press Start 2P', cursive" }}
            >
              New!
            </span>
          </motion.div>
        )}

        {/* Top ornament bar */}
        <div
          className="h-2 w-full"
          style={{ background: colors.frame }}
        />

        {/* Item image area */}
        <div className="px-5 pt-4 pb-3">
          <div
            className="relative mx-auto w-[140px] h-[140px] rounded-xl flex items-center justify-center p-3"
            style={{
              background: `radial-gradient(ellipse at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 70%, transparent 100%)`,
              boxShadow: `inset 0 0 20px ${colors.glow}`,
            }}
          >
            {/* Animated glow ring */}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                border: `2px solid ${colors.border}60`,
              }}
              animate={{
                boxShadow: [
                  `0 0 8px ${colors.glow}`,
                  `0 0 20px ${colors.glow}`,
                  `0 0 8px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-contain drop-shadow-lg"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
            />
          </div>
        </div>

        {/* Divider with ornament */}
        <div className="flex items-center gap-2 px-5">
          <div className="flex-1 h-px" style={{ background: `${colors.border}40` }} />
          <div
            className="w-2 h-2 rotate-45"
            style={{ background: colors.border }}
          />
          <div className="flex-1 h-px" style={{ background: `${colors.border}40` }} />
        </div>

        {/* Item info */}
        <div className="px-5 pt-3 pb-4 text-center">
          <h3
            className="font-bold text-base leading-tight"
            style={{ color: colors.accent, fontFamily: "'Press Start 2P', cursive", fontSize: "11px", lineHeight: "1.5" }}
          >
            {item.name}
          </h3>

          {/* Rarity badge */}
          <div className="mt-2 flex justify-center">
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
              style={{ background: colors.badge, color: colors.badgeText }}
            >
              {item.rarity}{item.isSpecialReward ? " \u2605" : ""}
            </span>
          </div>

          {item.quote && (
            <p
              className="mt-2.5 text-[11px] italic leading-relaxed opacity-70"
              style={{ color: colors.accent }}
            >
              &ldquo;{item.quote}&rdquo;
            </p>
          )}
        </div>

        {/* Bottom ornament bar */}
        <div
          className="h-2 w-full"
          style={{ background: colors.frame }}
        />
      </div>
    </div>
  );
}

function MedalCard({ amount }: { amount: number }) {
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative w-[260px] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #fef9c3 0%, #fde68a 40%, #f59e0b 100%)",
          border: "3px solid #f59e0b",
          boxShadow: "0 0 28px rgba(245,158,11,0.4), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Top bar */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)" }} />

        {/* Inner frame */}
        <div className="absolute inset-[6px] rounded-xl pointer-events-none" style={{ border: "1.5px solid rgba(245,158,11,0.3)" }} />

        {/* Medal display */}
        <div className="px-5 pt-6 pb-4 flex flex-col items-center">
          <motion.div
            className="relative w-[100px] h-[100px] flex items-center justify-center"
            initial={{ rotateY: -180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 150, damping: 12 }}
          >
            {/* Glow behind medal */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src="/items/medal.png"
              alt="Medal"
              className="w-20 h-20 object-contain drop-shadow-lg relative z-10"
            />
          </motion.div>

          <motion.div
            className="mt-4 text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <p
              className="font-bold text-amber-900"
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "18px" }}
            >
              +{amount}
            </p>
            <p className="text-sm font-semibold text-amber-800 mt-1">
              Medals Earned
            </p>
            <p className="text-xs text-amber-700/70 mt-1">
              From item drops
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 px-5">
          <div className="flex-1 h-px bg-amber-500/30" />
          <div className="w-2 h-2 rotate-45 bg-amber-500" />
          <div className="flex-1 h-px bg-amber-500/30" />
        </div>

        <div className="h-6" />

        {/* Bottom bar */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)" }} />
      </div>
    </div>
  );
}

function EvolutionCard({ reward }: { reward: ProgressionReward }) {
  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="relative w-[260px] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #f3e8ff 0%, #ddd6fe 40%, #a78bfa 100%)",
          border: "3px solid #8b5cf6",
          boxShadow: "0 0 32px rgba(139,92,246,0.5), 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Top bar */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%)" }} />

        {/* Inner frame */}
        <div className="absolute inset-[6px] rounded-xl pointer-events-none" style={{ border: "1.5px solid rgba(139,92,246,0.3)" }} />

        {/* Evolution display */}
        <div className="px-5 pt-6 pb-4 flex flex-col items-center">
          <motion.div
            className="relative w-[100px] h-[100px] flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 10 }}
          >
            {/* Pulsing aura */}
            <motion.div
              className="absolute inset-[-20px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Sparkle particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-violet-300"
                style={{
                  top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                  left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center relative z-10 shadow-lg">
              <TrendingUp className="w-9 h-9 text-white" />
            </div>
          </motion.div>

          <motion.div
            className="mt-4 text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="font-bold text-violet-900"
              style={{ fontFamily: "'Press Start 2P', cursive", fontSize: "10px", lineHeight: "1.6" }}
            >
              Esko Evolved!
            </p>
            <p className="text-base font-bold text-violet-800 mt-2">
              {reward.stage}
            </p>
            {reward.medalsAwarded > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <img src="/items/medal.png" alt="Medal" className="w-4 h-4" />
                <span className="text-sm font-bold text-violet-700">
                  +{reward.medalsAwarded} Medals
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 px-5">
          <div className="flex-1 h-px bg-violet-400/30" />
          <div className="w-2 h-2 rotate-45 bg-violet-400" />
          <div className="flex-1 h-px bg-violet-400/30" />
        </div>

        <div className="h-6" />

        {/* Bottom bar */}
        <div className="h-2 w-full" style={{ background: "linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%)" }} />
      </div>
    </div>
  );
}

// --- Stack indicator dots ---

function StackDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mt-5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
          }}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
}

// --- Main modal ---

export function ItemRewardModal({ items, medalsAwarded = 0, progressionReward, open, onOpenChange }: ItemRewardModalProps) {
  const { playWithVibrate } = useHaptics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  // Build the ordered card list: items first, then medals, then evolution
  const cards: RewardCard[] = [];
  items.forEach((item) => cards.push({ type: "item", data: item }));
  if (medalsAwarded > 0) cards.push({ type: "medals", data: { amount: medalsAwarded } });
  if (progressionReward && progressionReward.medalsAwarded > 0) cards.push({ type: "evolution", data: progressionReward });

  // Reset index when modal opens, play initial sound
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      // Play sound for the first card
      if (cards.length > 0) {
        const firstCard = cards[0];
        if (firstCard.type === "item" && (firstCard.data as AwardedItem).isNew) {
          playWithVibrate("newDrop");
        } else if (firstCard.type === "evolution") {
          playWithVibrate("evolution");
        } else {
          playWithVibrate("reward");
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clamp index to valid range in case cards array shrinks between renders
  const safeIndex = Math.min(currentIndex, Math.max(cards.length - 1, 0));

  const isLastCard = safeIndex === cards.length - 1;

  const advance = useCallback(() => {
    if (isLastCard) {
      onOpenChange(false);
      return;
    }
    // Play haptic for card transition
    const nextCard = cards[safeIndex + 1];
    if (nextCard?.type === "evolution") {
      playWithVibrate("evolution");
    } else if (nextCard?.type === "item" && (nextCard.data as AwardedItem).isNew) {
      playWithVibrate("newDrop");
    } else {
      playWithVibrate("tap");
    }
    setDirection(1);
    setCurrentIndex((prev) => prev + 1);
  }, [isLastCard, safeIndex, cards, onOpenChange, playWithVibrate]);

  if (!open || cards.length === 0) return null;

  // How many cards remain behind the current one
  const remaining = cards.length - 1 - safeIndex;

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
            onClick={advance}
          />

          {/* Card stack area */}
          <div
            className="relative z-10 w-[280px] h-[380px] flex items-center justify-center cursor-pointer"
            onClick={advance}
          >
            {/* Background stacked cards (up to 2 behind) */}
            {remaining >= 2 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: "translateY(8px) translateX(8px) rotate(3deg) scale(0.94)",
                  opacity: 0.25,
                }}
              >
                <div className="w-[260px] h-[340px] rounded-2xl bg-white/20 border border-white/10" />
              </div>
            )}
            {remaining >= 1 && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: "translateY(4px) translateX(4px) rotate(1.5deg) scale(0.97)",
                  opacity: 0.4,
                }}
              >
                <div className="w-[260px] h-[340px] rounded-2xl bg-white/30 border border-white/15" />
              </div>
            )}

            {/* Active card */}
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={safeIndex}
                className="absolute inset-0 flex items-center justify-center"
                custom={direction}
                initial={{ scale: 0.85, opacity: 0, rotateY: -30, x: -60 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0, x: 0 }}
                exit={{ scale: 0.8, opacity: 0, rotateY: 20, x: 80, y: -20 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                  mass: 0.8,
                }}
              >
                {cards[safeIndex].type === "item" && (
                  <ItemCard item={cards[safeIndex].data as AwardedItem} />
                )}
                {cards[safeIndex].type === "medals" && (
                  <MedalCard amount={(cards[safeIndex].data as { amount: number }).amount} />
                )}
                {cards[safeIndex].type === "evolution" && (
                  <EvolutionCard reward={cards[safeIndex].data as ProgressionReward} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          {cards.length > 1 && (
            <StackDots total={cards.length} current={safeIndex} />
          )}

          {/* Action prompt */}
          <motion.div
            className="relative z-10 mt-4 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isLastCard ? (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
                className="px-6 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-full text-sm font-semibold backdrop-blur-sm transition-all active:scale-95"
              >
                Awesome!
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); advance(); }}
                className="flex items-center gap-1 px-4 py-2 text-white/50 hover:text-white/80 text-xs font-medium transition-colors"
              >
                Tap for next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
