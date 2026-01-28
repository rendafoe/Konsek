import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Activity, Heart, Shield } from "lucide-react";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  const features = [
    { icon: Heart, title: "Stay Alive", desc: "Your running habits keep your companion healthy." },
    { icon: Shield, title: "Earn Gear", desc: "Unlock pixel-art equipment by hitting milestones." },
    { icon: Activity, title: "Track Progress", desc: "Syncs seamlessly with Strava activities." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-ui relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary border-4 border-black" />
          <h1 className="text-xl md:text-2xl font-pixel tracking-tighter">RUN COMP</h1>
        </div>
        <a 
          href="/api/login" 
          className="pixel-btn-secondary"
        >
          Login
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-pixel leading-tight mb-6">
              Run to Keep<br/>
              <span className="text-primary">Them Alive</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md leading-relaxed">
              A minimalist, Nordic-inspired companion that thrives on your consistency. Connect Strava, run often, and watch your pixel friend grow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/api/login"
                className="pixel-btn-primary flex items-center justify-center gap-2 text-base py-4"
              >
                Start Journey <ArrowRight size={16} />
              </a>
              <button className="pixel-btn-outline py-4">
                View Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Hero Visual Construction */}
            <div className="bg-card p-8 border-4 border-border shadow-[16px_16px_0px_0px_rgba(0,0,0,0.1)] relative">
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent border-4 border-black z-20 animate-bounce" />
              
              <div className="aspect-square bg-blue-50/50 border-2 border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden">
                 {/* Pixel Ground */}
                 <div className="absolute bottom-0 w-full h-1/4 bg-amber-100 border-t-4 border-primary/20" />
                 
                 {/* Character Placeholder */}
                 <div className="w-24 h-32 bg-primary/20 animate-pulse rounded border-4 border-primary relative z-10">
                    <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-black/50" />
                    <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-black/50" />
                 </div>
              </div>
              
              <div className="mt-6 flex justify-between items-center border-t-2 border-border pt-4">
                <div>
                   <div className="text-xs font-pixel text-muted-foreground mb-1">HEALTH</div>
                   <div className="flex gap-1">
                     {[1,2,3,4,5].map(i => (
                       <div key={i} className="w-4 h-4 bg-accent border-2 border-black" />
                     ))}
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-xs font-pixel text-muted-foreground mb-1">STREAK</div>
                   <div className="font-pixel text-xl">12 DAYS</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 border-l-4 border-primary hover:bg-white transition-colors group"
            >
              <div className="mb-4 text-primary group-hover:scale-110 transition-transform origin-left">
                <f.icon size={32} />
              </div>
              <h3 className="font-pixel text-sm mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
