"use client";

import { useState, useRef, useCallback } from "react";
import { useTutorial } from "@/lib/tutorial-context";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, Footprints, Backpack, Trophy, Users, Sparkles,
  ChevronRight, ChevronLeft, X, ArrowRight,
} from "lucide-react";

interface TutorialStep {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  visual: React.ReactNode;
  accent: string;
}

const STEPS: TutorialStep[] = [
  {
    id: "welcome",
    icon: <Sparkles size={20} />,
    title: "Welcome to Konsek",
    subtitle: "Your running companion",
    description:
      "Konsek turns your real-world runs into a pixel-art adventure. Care for Esko, your digital companion, by staying consistent with your running. The more you run, the more Esko thrives.",
    visual: (
      <div className="relative flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full bg-primary/20 animate-pulse" />
        <img src="/esko/esko-egg.png" alt="Esko Egg" className="w-24 h-24 relative z-10 animate-esko-egg" />
      </div>
    ),
    accent: "from-primary/30 to-secondary/20",
  },
  {
    id: "esko",
    icon: <Heart size={20} />,
    title: "Meet Esko",
    subtitle: "8 evolution stages",
    description:
      "Esko starts as an egg and evolves through 8 stages as you complete runs. Each milestone unlocks a new form — from hatchling all the way to a fully maxed companion.",
    visual: (
      <div className="flex items-end justify-center gap-1">
        {[
          { src: "/esko/esko-egg.png", h: "h-8" },
          { src: "/esko/esko-hatchling-v1.png", h: "h-10" },
          { src: "/esko/esko-hatchling-v2.png", h: "h-12" },
          { src: "/esko/esko-child.png", h: "h-14" },
          { src: "/esko/esko-adolescent.png", h: "h-16" },
          { src: "/esko/esko-young-adult.png", h: "h-18" },
          { src: "/esko/esko-mature.png", h: "h-20" },
          { src: "/esko/esko-maxed.png", h: "h-24" },
        ].map((stage, i) => (
          <motion.img
            key={stage.src}
            src={stage.src}
            alt=""
            className={`${stage.h} w-auto object-contain`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          />
        ))}
      </div>
    ),
    accent: "from-green-500/20 to-emerald-600/10",
  },
  {
    id: "health",
    icon: <Footprints size={20} />,
    title: "Running & Health",
    subtitle: "Keep Esko alive",
    description:
      "Esko's health depends on your consistency. Runs of at least 1 km count toward keeping Esko healthy. Rest for more than 2 days and Esko's health starts to decline. Stay consistent to keep your companion in perfect shape.",
    visual: (
      <div className="flex flex-col items-center gap-3">
        <img src="/esko/esko-maxed.png" alt="Healthy Esko" className="w-20 h-20 object-contain" />
        <div className="flex gap-1.5">
          {[
            { label: "Perfect", color: "bg-green-500" },
            { label: "Rested", color: "bg-blue-500" },
            { label: "Weak", color: "bg-yellow-500" },
            { label: "Critical", color: "bg-red-500" },
          ].map((state) => (
            <div key={state.label} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-2 rounded-full ${state.color}`} />
              <span className="text-[8px] text-muted-foreground font-medium">{state.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    accent: "from-red-500/15 to-green-500/15",
  },
  {
    id: "items",
    icon: <Backpack size={20} />,
    title: "Items & Gear",
    subtitle: "55 collectibles to find",
    description:
      "Every run has a chance to reward you with collectible items. Items range from common to mythic rarity. Equip them to customize Esko's look, and browse your full collection in the Gear tab.",
    visual: (
      <div className="grid grid-cols-4 gap-2">
        {[
          { src: "/items/classic-beanie.png", rarity: "bg-gray-400" },
          { src: "/items/rain-jacket.png", rarity: "bg-green-500" },
          { src: "/items/carbon-plated-shoes.png", rarity: "bg-blue-500" },
          { src: "/items/golden-belt-buckle.png", rarity: "bg-purple-500" },
          { src: "/items/katana.png", rarity: "bg-yellow-500" },
          { src: "/items/mythic-crown.png", rarity: "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500" },
          { src: "/items/skill-cape.png", rarity: "bg-yellow-500" },
          { src: "/items/doggo.png", rarity: "bg-purple-500" },
        ].map((item, i) => (
          <motion.div
            key={item.src}
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
          >
            <div className="bg-background/60 rounded-lg p-1.5 border border-border/50">
              <img src={item.src} alt="" className="w-10 h-10 mx-auto object-contain" />
            </div>
            <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full ${item.rarity}`} />
          </motion.div>
        ))}
      </div>
    ),
    accent: "from-purple-500/20 to-yellow-500/15",
  },
  {
    id: "medals",
    icon: <Trophy size={20} />,
    title: "Medals & Shop",
    subtitle: "Earn and spend",
    description:
      "Medals are your in-game currency. Earn them from finding items, completing daily check-ins, evolving Esko, and referring friends. Spend medals in the shop to buy specific items you want for your collection.",
    visual: (
      <div className="flex flex-col items-center gap-3">
        <motion.img
          src="/items/medal.png"
          alt="Medal"
          className="w-16 h-16 object-contain"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <div className="flex flex-col items-center gap-1 px-3 py-2 bg-background/60 rounded-lg border border-border/50">
            <span className="font-pixel text-xs text-foreground">+1-8</span>
            <span>Per Item</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-2 bg-background/60 rounded-lg border border-border/50">
            <span className="font-pixel text-xs text-foreground">+2</span>
            <span>Check-in</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-2 bg-background/60 rounded-lg border border-border/50">
            <span className="font-pixel text-xs text-foreground">+5</span>
            <span>Referral</span>
          </div>
        </div>
      </div>
    ),
    accent: "from-yellow-500/25 to-amber-600/15",
  },
  {
    id: "friends",
    icon: <Users size={20} />,
    title: "Friends & Social",
    subtitle: "Run together",
    description:
      "Connect with other runners using friend codes. See your friends' Esko stages, health, and stats. Discover new users to follow, and earn bonus medals by referring friends to Konsek.",
    visual: (
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
            <img src="/esko/esko-mature.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-[9px] text-muted-foreground">You</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-secondary/20 border-2 border-secondary/40 flex items-center justify-center">
            <img src="/esko/esko-young-adult.png" alt="" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-[9px] text-muted-foreground">Friend</span>
        </div>
      </div>
    ),
    accent: "from-blue-500/20 to-primary/15",
  },
  {
    id: "start",
    icon: <ArrowRight size={20} />,
    title: "You're All Set",
    subtitle: "Time to run",
    description:
      "Hatch your Esko, connect Strava, and head out for a run. Your companion is waiting. You can revisit this tutorial anytime from the Info page.",
    visual: (
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute w-36 h-36 rounded-full border-2 border-dashed border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-28 h-28 rounded-full border border-dashed border-accent/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <img src="/esko/esko-egg.png" alt="Esko Egg" className="w-20 h-20 relative z-10 animate-esko-egg" />
      </div>
    ),
    accent: "from-primary/25 to-accent/20",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
    scale: 0.95,
  }),
};

export function Tutorial() {
  const { isTutorialOpen, completeTutorial, closeTutorial } = useTutorial();
  const [currentStep, setCurrentStep] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const paginate = useCallback((newDirection: number) => {
    const nextStep = currentStep + newDirection;
    if (nextStep < 0 || nextStep >= STEPS.length) return;
    setPage([page + newDirection, newDirection]);
    setCurrentStep(nextStep);
  }, [currentStep, page]);

  const goToStep = useCallback((stepIndex: number) => {
    const dir = stepIndex > currentStep ? 1 : -1;
    setPage([page + dir, dir]);
    setCurrentStep(stepIndex);
  }, [currentStep, page]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Only register horizontal swipes (not vertical scrolls)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) paginate(1);
      else paginate(-1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleFinish = () => {
    completeTutorial();
    setCurrentStep(0);
    setPage([0, 0]);
  };

  const handleSkip = () => {
    completeTutorial();
    setCurrentStep(0);
    setPage([0, 0]);
  };

  if (!isTutorialOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleSkip}
      />

      {/* Tutorial Card */}
      <motion.div
        className="relative z-10 w-[92vw] max-w-md mx-auto"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-card/95 backdrop-blur-md rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
          {/* Skip button */}
          {!isLast && (
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all"
              aria-label="Skip tutorial"
            >
              <X size={18} />
            </button>
          )}

          {/* Visual area with gradient background */}
          <div className={`relative h-44 flex items-center justify-center bg-gradient-to-br ${step.accent} overflow-hidden`}>
            {/* Decorative pixel grid */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 7px, currentColor 7px, currentColor 8px),
                repeating-linear-gradient(90deg, transparent, transparent 7px, currentColor 7px, currentColor 8px)`,
            }} />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                {step.visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="px-6 pt-5 pb-4">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id + "-content"}
                custom={direction}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Step badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {step.subtitle}
                  </span>
                </div>

                <h2 className="font-pixel text-sm text-foreground mb-2">{step.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: dots + navigation */}
          <div className="px-6 pb-5 pt-2 flex items-center justify-between">
            {/* Step indicators */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 h-2 bg-primary"
                      : i < currentStep
                        ? "w-2 h-2 bg-primary/40"
                        : "w-2 h-2 bg-muted-foreground/20"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={() => paginate(-1)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  aria-label="Previous step"
                >
                  <ChevronLeft size={18} />
                </button>
              )}

              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-sm"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => paginate(1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-sm"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
