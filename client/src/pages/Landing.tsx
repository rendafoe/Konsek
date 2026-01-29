import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Heart, Mountain, Sparkles } from "lucide-react";
import { SpritePreview, getRandomSpriteType } from "@/components/SpriteCharacter";
import { useMemo } from "react";
import { type SpriteType } from "@shared/schema";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Pick a random sprite type once on initial render
  const displayedSprite = useMemo<SpriteType>(() => getRandomSpriteType(), []);

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  const features = [
    { icon: Heart, title: "Stay Alive", desc: "Your running habits keep your companion healthy and thriving." },
    { icon: Sparkles, title: "Earn Gear", desc: "Unlock rare Nordic treasures by running consistently." },
    { icon: Activity, title: "Track Progress", desc: "Syncs seamlessly with Strava to log your activities." },
  ];

  return (
    <div className="min-h-screen aurora-bg text-foreground relative overflow-hidden">
      {/* Northern Lights Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(ellipse_at_top,_rgba(116,165,127,0.3),transparent_50%)]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Mountain size={32} className="text-white" />
          <h1 className="text-xl font-bold text-white tracking-tight">Konsek</h1>
        </div>
        <a 
          href="/api/login" 
          className="px-5 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
          data-testid="link-login"
        >
          Log In
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Run to Keep<br/>
              <span className="text-emerald-300">Them Alive</span>
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-lg leading-relaxed">
              A minimalist, Nordic-inspired companion that thrives on your consistency. Connect Strava, run often, and watch your pixel friend grow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/api/login"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-emerald-800 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl"
                data-testid="button-get-started"
              >
                Start Journey <ArrowRight size={20} />
              </a>
            </div>
            
            <p className="mt-6 text-sm text-white/50">
              Free forever. No credit card required.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Tamagotchi-style device mockup with animated sprite */}
            <div className="device-screen mx-auto max-w-sm">
              <div className="device-screen-inner">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-emerald-800/20">
                  <span className="font-bold text-sm text-emerald-900 dark:text-emerald-100 capitalize">
                    {displayedSprite}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200">
                    Lv.7
                  </span>
                </div>
                
                {/* Animated Creature Display */}
                <div className="flex justify-center items-center min-h-[160px] mb-4">
                  <SpritePreview spriteType={displayedSprite} size={128} />
                </div>
                
                {/* Health Bar */}
                <div className="mb-2">
                  <div className="text-xs font-bold text-center mb-2 text-emerald-800/70 dark:text-emerald-300/70">Health</div>
                  <div className="h-4 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden border-2 border-emerald-800 dark:border-emerald-600">
                    <div className="h-full w-[85%] bg-emerald-600 dark:bg-emerald-400 transition-all" />
                  </div>
                  <div className="text-sm font-bold text-center mt-1 text-emerald-900 dark:text-emerald-100">85%</div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-amber-400 rounded-full animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-emerald-400/50 rounded-full blur-sm" />
          </motion.div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group"
            >
              <div className="mb-5 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <f.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        
        {/* Footer */}
        <div className="mt-24 text-center">
          <p className="text-white/40 text-sm">
            Consistency awaits.
          </p>
        </div>
      </main>
    </div>
  );
}
