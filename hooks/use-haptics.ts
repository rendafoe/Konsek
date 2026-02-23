"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundType = "tap" | "success" | "reward" | "newDrop" | "evolution" | "equip" | "error";
type VibrationPattern = "tap" | "success" | "reward" | "newDrop" | "evolution" | "error";

interface HapticsPrefs {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

const PREFS_KEY = "konsek_haptics_prefs";

const DEFAULT_PREFS: HapticsPrefs = {
  soundEnabled: true,
  hapticsEnabled: true,
};

function loadPrefs(): HapticsPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PREFS;
}

function savePrefs(prefs: HapticsPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

// Module-level singleton so all hook instances share the same prefs
let globalPrefs: HapticsPrefs = DEFAULT_PREFS;
const listeners = new Set<(prefs: HapticsPrefs) => void>();

function initGlobalPrefs() {
  globalPrefs = loadPrefs();
}

function setGlobalPrefs(next: HapticsPrefs) {
  globalPrefs = next;
  savePrefs(next);
  listeners.forEach((l) => l(next));
}

const VIBRATION_PATTERNS: Record<VibrationPattern, number | number[]> = {
  tap: 10,
  success: [15, 50, 15],
  reward: [10, 40, 10, 40, 10],
  newDrop: [15, 30, 15, 30, 15, 30, 20],
  evolution: [20, 30, 20, 30, 40, 30, 60],
  error: 30,
};

// Sound synthesis functions using Web Audio API
function playTap(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.06);
}

function playSuccess(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Two ascending tones
  [0, 0.1].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(i === 0 ? 880 : 1320, t + delay);
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(0.12, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.15);
    osc.start(t + delay);
    osc.stop(t + delay + 0.15);
  });
}

function playReward(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Three ascending sparkly tones
  [0, 0.08, 0.16].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime([880, 1100, 1320][i], t + delay);
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(0.1, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.2);
    osc.start(t + delay);
    osc.stop(t + delay + 0.2);
  });
}

function playEvolution(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Magical ascending sweep with harmonics
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const gain2 = ctx.createGain();
  osc.connect(gain);
  osc2.connect(gain2);
  gain.connect(ctx.destination);
  gain2.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(1760, t + 0.6);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
  gain.gain.setValueAtTime(0.12, t + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.start(t);
  osc.stop(t + 0.8);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(660, t + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(2640, t + 0.7);
  gain2.gain.setValueAtTime(0, t + 0.1);
  gain2.gain.linearRampToValueAtTime(0.06, t + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  osc2.start(t + 0.1);
  osc2.stop(t + 0.9);
}

function playNewDrop(ctx: AudioContext) {
  const t = ctx.currentTime;
  // Celebratory ascending chime with shimmer - 4 quick sparkly notes
  [0, 0.07, 0.14, 0.24].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = i < 3 ? "sine" : "triangle";
    osc.frequency.setValueAtTime([880, 1100, 1320, 1760][i], t + delay);
    gain.gain.setValueAtTime(0, t + delay);
    gain.gain.linearRampToValueAtTime(i === 3 ? 0.14 : 0.1, t + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + (i === 3 ? 0.35 : 0.18));
    osc.start(t + delay);
    osc.stop(t + delay + (i === 3 ? 0.35 : 0.18));
  });
}

function playEquip(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.start(t);
  osc.stop(t + 0.08);
}

function playError(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.start(t);
  osc.stop(t + 0.2);
}

const SOUND_PLAYERS: Record<SoundType, (ctx: AudioContext) => void> = {
  tap: playTap,
  success: playSuccess,
  reward: playReward,
  newDrop: playNewDrop,
  evolution: playEvolution,
  equip: playEquip,
  error: playError,
};

export function useHaptics() {
  const [prefs, setPrefs] = useState<HapticsPrefs>(globalPrefs);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const initializedRef = useRef(false);

  // Subscribe to global prefs on mount and sync from localStorage once
  useEffect(() => {
    initGlobalPrefs();
    setPrefs(globalPrefs);
    listeners.add(setPrefs);
    return () => {
      listeners.delete(setPrefs);
    };
  }, []);

  const getAudioContext = useCallback((): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const play = useCallback(
    (sound: SoundType) => {
      if (!prefs.soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      SOUND_PLAYERS[sound](ctx);
    },
    [prefs.soundEnabled, getAudioContext]
  );

  const vibrate = useCallback(
    (pattern: VibrationPattern) => {
      if (!prefs.hapticsEnabled) return;
      try {
        navigator?.vibrate?.(VIBRATION_PATTERNS[pattern]);
      } catch {}
    },
    [prefs.hapticsEnabled]
  );

  const playWithVibrate = useCallback(
    (sound: SoundType, vibrationPattern?: VibrationPattern) => {
      play(sound);
      vibrate(vibrationPattern || (sound as VibrationPattern));
    },
    [play, vibrate]
  );

  const toggleSound = useCallback(() => {
    setGlobalPrefs({ ...globalPrefs, soundEnabled: !globalPrefs.soundEnabled });
  }, []);

  const toggleHaptics = useCallback(() => {
    setGlobalPrefs({ ...globalPrefs, hapticsEnabled: !globalPrefs.hapticsEnabled });
  }, []);

  return { play, vibrate, playWithVibrate, prefs, toggleSound, toggleHaptics };
}
