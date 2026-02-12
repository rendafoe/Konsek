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

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("konsek_referral_code", ref);
    }
  }, []);

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
      signIn("strava", { callbackUrl: "/" });
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
    <div
      className="min-h-[100dvh] h-[100dvh] overflow-y-auto snap-y snap-mandatory text-[#e8efe5]"
    >
      <div
        className="relative"
        style={{
          backgroundImage: "url(/backgrounds/landing.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center calc(100% + 30vh)",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay covering entire landing page */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      {/* ========== PAGE 1: Hero ========== */}
      <section className="min-h-[100dvh] snap-start snap-always relative flex flex-col">
        {/* Navigation */}
        <nav className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Flame size={20} className="text-[#d4a574]" />
              <span
                className="text-base font-light tracking-wide text-[#e8efe5]"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                Konsek
              </span>
            </div>
            <button
              onClick={handleSignIn}
              className="text-sm text-[#c5d4c2] hover:text-[#e8efe5] transition-colors duration-300"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              data-testid="link-login"
            >
              Sign in
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-10"
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-[#e8efe5] leading-tight"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
            >
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
        {/* Evolution Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative z-10"
        >
          <p
            className="text-sm text-[#c5d4c2] tracking-[0.2em] uppercase mb-12 font-light"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
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
                <span
                  className="text-xs md:text-sm text-[#c5d4c2] font-light tracking-wide"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                >
                  {stage.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Connecting line */}
          <div className="max-w-md mx-auto mt-8">
            <div className="h-px bg-gradient-to-r from-transparent via-[#40916c]/30 to-transparent" />
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
                className="flex items-center gap-3 px-5 py-4 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors duration-300"
              >
                <feature.icon
                  size={20}
                  className="text-[#7cb98b] flex-shrink-0"
                />
                <span
                  className="text-base md:text-lg font-light text-[#e8efe5] tracking-wide"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
                >
                  {feature.title}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========== PAGE 3: Final CTA ========== */}
      <section className="min-h-screen snap-start snap-always relative flex flex-col items-center justify-center px-6">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center relative z-10"
        >
          {/* Headline */}
          <h2
            className="text-2xl md:text-3xl lg:text-4xl font-light text-[#e8efe5] mb-10 tracking-tight"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
          >
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
    </div>
  );
}
