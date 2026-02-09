"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, BarChart3 } from "lucide-react";
import { useEffect } from "react";

const STAGE_IMAGES: Record<string, string> = {
  "egg": "/esko/esko-egg.png",
  "hatchling": "/esko/esko-hatchling-v1.png",
  "child": "/esko/esko-child.png",
};

function EskoHero({ stage, className }: { stage: string; className?: string }) {
  return (
    <img
      src={STAGE_IMAGES[stage]}
      alt={`Esko - ${stage}`}
      className={`object-contain ${className || ''}`}
    />
  );
}

function MysteryStage({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <span className="text-[#40916c]/60 font-serif text-4xl md:text-5xl animate-mystery-bounce select-none">
        ?
      </span>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) return null;

  const handleSignIn = () => {
    if (process.env.NODE_ENV === "development") {
      signIn("credentials", { userId: "dev-user-1", callbackUrl: "/" });
    } else {
      signIn("google", { callbackUrl: "/" });
    }
  };

  const evolutionStages = [
    { id: "egg", label: "Egg", unlocked: true },
    { id: "hatchling", label: "Hatchling", unlocked: true },
    { id: "child", label: "Child", unlocked: true },
    { id: "mature", label: "Mature", unlocked: false },
    { id: "maxed", label: "Maxed", unlocked: false },
  ];

  const features = [
    { icon: Flame, title: "Embrace Consistency" },
    { icon: Sparkles, title: "Collect Rewards" },
    { icon: BarChart3, title: "Visualize Growth" },
  ];

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-[#1a2f23] text-[#e8efe5]">
      {/* Subtle grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ========== PAGE 1: Hero with Esko ========== */}
      <section className="h-screen snap-start snap-always relative flex flex-col">
        {/* Soft northern glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[500px] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(64,145,108,0.12) 0%, rgba(45,90,61,0.06) 50%, transparent 80%)'
            }}
          />
        </div>

        {/* Ambient side glows */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[#40916c]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 -right-32 w-72 h-72 bg-[#52796f]/6 rounded-full blur-[120px] pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Flame size={20} className="text-[#d4a574]" />
              <span className="text-base font-light tracking-wide text-[#e8efe5]">Konsek</span>
            </div>
            <button
              onClick={handleSignIn}
              className="text-sm text-[#8a9f87] hover:text-[#e8efe5] transition-colors duration-300"
              data-testid="link-login"
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          {/* Esko - LARGE and prominent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="relative mb-8"
          >
            {/* Warm ambient glow behind Esko */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#d4a574]/15 rounded-full blur-[80px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#e8a862]/10 rounded-full blur-[50px]" />

            {/* The character - no label */}
            <div className="relative">
              <EskoHero stage="child" className="w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 animate-esko-child" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[#e8efe5] leading-tight">
              Your running companion for{' '}
              <span className="text-[#7cb98b]">consistency</span>
            </h1>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <button
              onClick={handleSignIn}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#40916c] text-[#e8efe5] rounded-full font-medium text-base hover:bg-[#4aa578] transition-all duration-300 shadow-lg shadow-[#40916c]/20"
              data-testid="button-get-started"
            >
              Begin your journey
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-[#40916c]/30 flex items-start justify-center p-1.5"
          >
            <div className="w-1 h-2 bg-[#40916c]/50 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ========== PAGE 2: Evolution + Features ========== */}
      <section className="min-h-screen snap-start snap-always relative flex flex-col items-center justify-center px-6 py-16">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#40916c]/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Evolution Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative z-10"
        >
          <p className="text-sm text-[#6b7d68] tracking-[0.2em] uppercase mb-12 font-light">
            Watch Esko grow with every run
          </p>

          {/* Evolution stages */}
          <div className="flex justify-center items-end gap-6 md:gap-10 lg:gap-14">
            {evolutionStages.map((stage, i) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-3">
                  {stage.unlocked ? (
                    <img
                      src={STAGE_IMAGES[stage.id]}
                      alt={stage.label}
                      className={`w-full h-full object-contain ${
                        stage.id === 'egg' ? 'animate-esko-egg' :
                        stage.id === 'hatchling' ? 'animate-esko-hatchling-v1' :
                        'animate-esko-child'
                      }`}
                    />
                  ) : (
                    <MysteryStage className="w-full h-full" />
                  )}
                </div>
                <span className="text-xs md:text-sm text-[#8a9f87] font-light tracking-wide">
                  {stage.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Connecting line */}
          <div className="max-w-md mx-auto mt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-[#40916c]/20 to-transparent" />
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-3xl relative z-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[#243d2e]/40 border border-[#40916c]/10 hover:border-[#40916c]/20 transition-colors duration-300"
              >
                <feature.icon
                  size={20}
                  className="text-[#7cb98b] flex-shrink-0"
                />
                <span className="text-base md:text-lg font-light text-[#e8efe5] tracking-wide">
                  {feature.title}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========== PAGE 3: Final CTA with Egg ========== */}
      <section className="min-h-screen snap-start snap-always relative flex flex-col items-center justify-center px-6">
        {/* Ambient glows */}
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-[#d4a574]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-72 h-72 bg-[#40916c]/8 rounded-full blur-[120px] pointer-events-none" />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center relative z-10"
        >
          {/* Egg - Large like hero */}
          <div className="relative mb-10">
            {/* Warm ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#d4a574]/12 rounded-full blur-[70px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#e8a862]/8 rounded-full blur-[40px]" />

            {/* The egg */}
            <EskoHero stage="egg" className="relative w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 animate-esko-egg" />
          </div>

          {/* Headline */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-[#e8efe5] mb-10 tracking-tight">
            Your Esko is waiting
          </h2>

          {/* CTA Button */}
          <button
            onClick={handleSignIn}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#40916c] text-[#e8efe5] rounded-full font-medium text-base hover:bg-[#4aa578] transition-all duration-300 shadow-lg shadow-[#40916c]/20"
          >
            Get started free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </motion.div>
      </section>
    </div>
  );
}
