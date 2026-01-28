import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface PixelCharacterProps {
  name: string;
  level: number;
  healthState: number; // 0=Healthy, 1=Rest, 2=Weak, 3=Critical, 4=Dead
  status: "alive" | "dead";
}

export function PixelCharacter({ name, level, healthState, status }: PixelCharacterProps) {
  const [animFrame, setAnimFrame] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimFrame(prev => (prev + 1) % 2);
    }, 800);
    return () => clearInterval(timer);
  }, []);
  
  const isDead = status === "dead" || healthState >= 4;
  const isCritical = healthState >= 3;
  const isWeak = healthState >= 2;
  
  // Nordic themed creature colors
  const getBodyColor = () => {
    if (isDead) return "bg-gray-500";
    if (isCritical) return "bg-amber-600";
    if (isWeak) return "bg-amber-700";
    return "bg-emerald-700"; // Forest green when healthy
  };
  
  const eyeColor = isDead ? "bg-gray-600" : "bg-stone-900";
  const bodyColor = getBodyColor();
  
  const healthPercent = isDead ? 0 : Math.max(0, 100 - healthState * 25);
  const healthBarColor = healthPercent > 70 ? "health-good" : healthPercent > 30 ? "health-warning" : "health-critical";
  
  const warningMessage = () => {
    if (healthState === 1) return null;
    if (healthState === 2) return "Your companion grows weary...";
    if (healthState === 3) return "Critical! Run soon!";
    if (isDead) return "Your companion has passed into legend.";
    return null;
  };

  return (
    <div className="device-screen mx-auto">
      <div className="device-screen-inner">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-current/20">
          <span className="font-pixel text-sm text-foreground">{name}</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Lv.{level}
          </span>
        </div>
        
        {/* Creature Display */}
        <div className="flex justify-center items-center min-h-[180px] mb-4">
          <motion.div
            animate={isDead ? {} : { y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {isDead ? (
              // Ghost/Tombstone
              <div className="flex flex-col items-center">
                <div className="w-20 h-24 bg-gray-400 dark:bg-gray-600 rounded-t-2xl border-4 border-gray-600 dark:border-gray-500 flex items-center justify-center relative">
                  <span className="font-pixel text-xs text-gray-700 dark:text-gray-300">RIP</span>
                </div>
                <div className="w-28 h-3 bg-emerald-900/30 rounded-b-lg" />
              </div>
            ) : (
              // Pixel Creature
              <div className="flex flex-col items-center gap-0.5">
                {/* Row 1: Top of head */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className="w-5 h-5" />
                </div>
                
                {/* Row 2: Eyes */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <div className={`w-5 h-5 ${eyeColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${eyeColor}`} />
                  <div className="w-5 h-5" />
                </div>
                
                {/* Row 3: Mouth */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${isWeak ? bodyColor : eyeColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className="w-5 h-5" />
                </div>
                
                {/* Row 4-5: Upper body */}
                <div className="flex gap-0.5">
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                </div>
                <div className="flex gap-0.5">
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                </div>
                
                {/* Row 6: Lower body */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className={`w-5 h-5 ${bodyColor}`} />
                  <div className="w-5 h-5" />
                </div>
                
                {/* Row 7: Legs with animation */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <motion.div 
                    className={`w-5 h-5 ${bodyColor}`}
                    animate={{ y: animFrame === 0 ? 0 : 2 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="w-5 h-5" />
                  <motion.div 
                    className={`w-5 h-5 ${bodyColor}`}
                    animate={{ y: animFrame === 1 ? 0 : 2 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="w-5 h-5" />
                </div>
                
                {/* Row 8: Feet with animation */}
                <div className="flex gap-0.5">
                  <div className="w-5 h-5" />
                  <motion.div 
                    className={`w-5 h-5 ${bodyColor}`}
                    animate={{ y: animFrame === 0 ? 0 : 2 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="w-5 h-5" />
                  <motion.div 
                    className={`w-5 h-5 ${bodyColor}`}
                    animate={{ y: animFrame === 1 ? 0 : 2 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="w-5 h-5" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Health Bar */}
        <div className="mb-3">
          <div className="text-xs font-bold text-center mb-2 text-foreground/70">Health</div>
          <div className="health-bar">
            <div 
              className={`health-bar-fill ${healthBarColor}`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <div className="text-sm font-bold text-center mt-1 text-foreground">{healthPercent}%</div>
        </div>
        
        {/* Warning Message */}
        {warningMessage() && (
          <div className={`text-center text-xs font-bold p-2 rounded-lg mt-2 ${
            isCritical || isDead 
              ? 'bg-destructive/20 text-destructive' 
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          } status-pulse`}>
            {warningMessage()}
          </div>
        )}
      </div>
    </div>
  );
}
