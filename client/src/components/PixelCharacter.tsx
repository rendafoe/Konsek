import { motion } from "framer-motion";

interface PixelCharacterProps {
  healthState: number; // 0-4
  status: "alive" | "dead";
  scale?: number;
}

export function PixelCharacter({ healthState, status, scale = 1 }: PixelCharacterProps) {
  // Simple CSS-based pixel art character
  // In a real app, this would likely be an HTML5 Canvas or SVG renderer
  
  const isDead = status === "dead" || healthState >= 4;
  
  return (
    <div 
      className="relative flex flex-col items-center justify-center pointer-events-none"
      style={{ transform: `scale(${scale})` }}
    >
      <motion.div
        animate={isDead ? {} : { y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {isDead ? (
          // Tombstone
          <div className="w-16 h-20 bg-gray-400 rounded-t-xl border-4 border-gray-600 flex items-center justify-center relative shadow-lg">
             <span className="text-xs font-bold text-gray-700 font-pixel">RIP</span>
             <div className="absolute bottom-0 w-full h-2 bg-green-800/20" />
          </div>
        ) : (
          // Character Body
          <div className="relative">
             {/* Head */}
            <div className={`w-12 h-12 ${healthState > 2 ? 'bg-amber-200' : 'bg-orange-200'} border-4 border-black relative`}>
              {/* Eyes */}
              <div className="absolute top-4 left-2 w-2 h-2 bg-black" />
              <div className="absolute top-4 right-2 w-2 h-2 bg-black" />
              
              {/* Mouth */}
              {healthState === 0 ? (
                 <div className="absolute bottom-3 left-4 w-4 h-1 bg-black" />
              ) : healthState === 1 ? (
                 <div className="absolute bottom-3 left-4 w-4 h-1 bg-black" />
              ) : (
                 <div className="absolute bottom-2 left-4 w-4 h-1 bg-black rounded-full" />
              )}
            </div>
            
            {/* Torso */}
            <div className="w-16 h-14 bg-blue-500 border-4 border-black -mt-1 relative z-10 mx-auto">
               {/* Arms */}
               <div className="absolute -left-3 top-2 w-3 h-10 bg-orange-200 border-4 border-black" />
               <div className="absolute -right-3 top-2 w-3 h-10 bg-orange-200 border-4 border-black" />
            </div>
            
            {/* Legs */}
            <div className="flex justify-center -mt-1 gap-2">
               <div className="w-5 h-8 bg-gray-700 border-4 border-black" />
               <div className="w-5 h-8 bg-gray-700 border-4 border-black" />
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Shadow */}
      <div className="w-20 h-4 bg-black/20 rounded-[50%] mt-2 blur-sm" />
    </div>
  );
}
