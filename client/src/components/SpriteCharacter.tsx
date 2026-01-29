import { useState, useEffect, useMemo } from "react";
import { type SpriteType, SPRITE_TYPES } from "@shared/schema";

import bearSprite from "@/assets/sprites/bear.png";
import elkSprite from "@/assets/sprites/elk.png";
import hareSprite from "@/assets/sprites/hare.png";
import spiritSprite from "@/assets/sprites/spirit.png";
import trollSprite from "@/assets/sprites/troll.png";

const SPRITE_SHEETS: Record<SpriteType, string> = {
  bear: bearSprite,
  elk: elkSprite,
  hare: hareSprite,
  spirit: spiritSprite,
  troll: trollSprite,
};

const SPRITE_NAMES: Record<SpriteType, string> = {
  bear: "Bear",
  elk: "Elk", 
  hare: "Hare",
  spirit: "Spirit",
  troll: "Troll",
};

// Each sprite frame is 32x32 pixels, 4 frames per animation
const FRAME_SIZE = 32;
const TOTAL_FRAMES = 4;
const SPRITE_SHEET_WIDTH = FRAME_SIZE * TOTAL_FRAMES; // 128px total

interface SpriteCharacterProps {
  spriteType: SpriteType;
  name?: string;
  level?: number;
  healthPercent?: number;
  isDead?: boolean;
  size?: number;
  showHealthBar?: boolean;
  showInfo?: boolean;
}

export function SpriteCharacter({
  spriteType,
  name,
  level = 1,
  healthPercent = 100,
  isDead = false,
  size = 128,
  showHealthBar = true,
  showInfo = true,
}: SpriteCharacterProps) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    if (isDead) return;
    
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % TOTAL_FRAMES);
    }, 300);
    
    return () => clearInterval(timer);
  }, [isDead]);
  
  const validSpriteType = spriteType in SPRITE_SHEETS ? spriteType : "bear";
  const spriteSheet = SPRITE_SHEETS[validSpriteType];
  const spriteName = SPRITE_NAMES[validSpriteType];
  
  // Scale factor to display the 32x32 sprite at the desired size
  const scale = size / FRAME_SIZE;
  
  const healthBarColor = healthPercent > 70 
    ? "health-good" 
    : healthPercent > 30 
      ? "health-warning" 
      : "health-critical";
  
  const warningMessage = () => {
    if (isDead) return "Your companion has passed into legend.";
    if (healthPercent <= 25) return "Critical! Run soon!";
    if (healthPercent <= 50) return "Your companion grows weary...";
    return null;
  };

  return (
    <div className="device-screen mx-auto" data-testid="sprite-device-screen">
      <div className="device-screen-inner">
        {showInfo && (
          <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-current/20">
            <span className="font-bold text-sm text-foreground" data-testid="character-name">
              {name || spriteName}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground" data-testid="character-level">
              Lv.{level}
            </span>
          </div>
        )}
        
        <div className="flex justify-center items-center min-h-[180px] mb-4">
          <div 
            className={`relative ${isDead ? 'grayscale opacity-50' : ''}`}
            style={{
              width: size,
              height: size,
              overflow: 'hidden',
            }}
            data-testid="sprite-display"
          >
            <div
              style={{
                width: SPRITE_SHEET_WIDTH * scale,
                height: FRAME_SIZE * scale,
                backgroundImage: `url(${spriteSheet})`,
                backgroundSize: `${SPRITE_SHEET_WIDTH * scale}px ${FRAME_SIZE * scale}px`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 0',
                transform: `translateX(-${frame * FRAME_SIZE * scale}px)`,
                imageRendering: 'pixelated',
              }}
            />
          </div>
        </div>
        
        {showHealthBar && (
          <div className="mb-3">
            <div className="text-xs font-bold text-center mb-2 text-foreground/70">Health</div>
            <div className="health-bar">
              <div 
                className={`health-bar-fill ${healthBarColor}`}
                style={{ width: `${healthPercent}%` }}
                data-testid="health-bar-fill"
              />
            </div>
            <div className="text-sm font-bold text-center mt-1 text-foreground" data-testid="health-percent">
              {healthPercent}%
            </div>
          </div>
        )}
        
        {warningMessage() && (
          <div 
            className={`text-center text-xs font-bold p-2 rounded-lg mt-2 status-pulse ${
              isDead || healthPercent <= 25
                ? 'bg-destructive/20 text-destructive' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}
            data-testid="status-warning"
          >
            {warningMessage()}
          </div>
        )}
      </div>
    </div>
  );
}

export function SpritePreview({ spriteType, size = 64 }: { spriteType: SpriteType; size?: number }) {
  const [frame, setFrame] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % TOTAL_FRAMES);
    }, 300);
    return () => clearInterval(timer);
  }, []);
  
  const validSpriteType = spriteType in SPRITE_SHEETS ? spriteType : "bear";
  const spriteSheet = SPRITE_SHEETS[validSpriteType];
  const scale = size / FRAME_SIZE;
  
  return (
    <div 
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
      }}
      data-testid={`sprite-preview-${spriteType}`}
    >
      <div
        style={{
          width: SPRITE_SHEET_WIDTH * scale,
          height: FRAME_SIZE * scale,
          backgroundImage: `url(${spriteSheet})`,
          backgroundSize: `${SPRITE_SHEET_WIDTH * scale}px ${FRAME_SIZE * scale}px`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '0 0',
          transform: `translateX(-${frame * FRAME_SIZE * scale}px)`,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}

// Helper to get a random sprite type
export function getRandomSpriteType(): SpriteType {
  return SPRITE_TYPES[Math.floor(Math.random() * SPRITE_TYPES.length)];
}
