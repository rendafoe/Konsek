import { db } from "@/lib/db";
import {
  characters,
  dailyCheckIns,
  medalTransactions,
  type MedalSource,
  type DailyCheckIn,
  type MedalTransaction
} from "@/shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Streak bonus probability table (for every 3rd day)
// [medals, probability%]
const STREAK_BONUS_PROBABILITIES: [number, number][] = [
  [3, 40],
  [4, 25],
  [5, 15],
  [6, 10],
  [7, 6],
  [8, 3],
  [9, 0.8],
  [10, 0.2],
];

/**
 * Roll streak bonus medals based on weighted probability
 */
function rollStreakBonus(): number {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const [medals, probability] of STREAK_BONUS_PROBABILITIES) {
    cumulative += probability;
    if (roll < cumulative) {
      return medals;
    }
  }

  return 3; // Fallback
}

/**
 * Award medals to a user (creates transaction + updates balance)
 */
export async function awardMedals(
  userId: string,
  amount: number,
  source: MedalSource,
  sourceId?: number,
  description?: string
): Promise<MedalTransaction> {
  if (amount <= 0) {
    throw new Error("Award amount must be positive");
  }

  // Get the user's active character to update balance
  const [character] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.status, "alive")));

  if (!character) {
    throw new Error("No active character found");
  }

  // Create transaction record
  const [transaction] = await db.insert(medalTransactions).values({
    userId,
    amount,
    source,
    sourceId: sourceId || null,
    description: description || `Earned ${amount} Medals`,
  }).returning();

  // Update character balance
  await db
    .update(characters)
    .set({ medalBalance: (character.medalBalance || 0) + amount })
    .where(eq(characters.id, character.id));

  return transaction;
}

/**
 * Spend medals (for purchases)
 */
export async function spendMedals(
  userId: string,
  amount: number,
  itemId: number,
  description?: string
): Promise<MedalTransaction> {
  if (amount <= 0) {
    throw new Error("Spend amount must be positive");
  }

  // Get the user's active character
  const [character] = await db
    .select()
    .from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.status, "alive")));

  if (!character) {
    throw new Error("No active character found");
  }

  if ((character.medalBalance || 0) < amount) {
    throw new Error("Insufficient medal balance");
  }

  // Create transaction record (negative amount for spending)
  const [transaction] = await db.insert(medalTransactions).values({
    userId,
    amount: -amount,
    source: "purchase",
    sourceId: itemId,
    description: description || `Spent ${amount} Medals`,
  }).returning();

  // Update character balance
  await db
    .update(characters)
    .set({ medalBalance: (character.medalBalance || 0) - amount })
    .where(eq(characters.id, character.id));

  return transaction;
}

/**
 * Get user's current medal balance
 */
export async function getMedalBalance(userId: string): Promise<number> {
  const [character] = await db
    .select({ medalBalance: characters.medalBalance })
    .from(characters)
    .where(and(eq(characters.userId, userId), eq(characters.status, "alive")));

  return character?.medalBalance || 0;
}

/**
 * Get medal transaction history
 */
export async function getMedalHistory(
  userId: string,
  limit: number = 50
): Promise<MedalTransaction[]> {
  return db
    .select()
    .from(medalTransactions)
    .where(eq(medalTransactions.userId, userId))
    .orderBy(desc(medalTransactions.createdAt))
    .limit(limit);
}

/**
 * Get the calendar date string in user's timezone
 */
function getCalendarDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Get user's check-in history ordered by date
 */
async function getRecentCheckIns(userId: string, limit: number = 30): Promise<DailyCheckIn[]> {
  return db
    .select()
    .from(dailyCheckIns)
    .where(eq(dailyCheckIns.userId, userId))
    .orderBy(desc(dailyCheckIns.checkInDate))
    .limit(limit);
}

/**
 * Calculate current streak from check-in history
 */
function calculateStreak(checkIns: DailyCheckIn[], todayDate: string): number {
  if (checkIns.length === 0) return 0;

  // Sort by date descending
  const sorted = [...checkIns].sort((a, b) =>
    new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
  );

  // Get today and yesterday dates for comparison
  const today = new Date(todayDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mostRecentCheckIn = sorted[0].checkInDate;

  // If most recent check-in is not today or yesterday, streak is broken
  if (mostRecentCheckIn !== todayDate && mostRecentCheckIn !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days
  let streak = 0;
  let expectedDate = mostRecentCheckIn === todayDate ? today : yesterday;

  for (const checkIn of sorted) {
    const checkInDateStr = checkIn.checkInDate;
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (checkInDateStr === expectedDateStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (checkInDateStr < expectedDateStr) {
      // Gap found, streak ends
      break;
    }
    // If checkInDate > expectedDate, skip (shouldn't happen with proper ordering)
  }

  return streak;
}

export interface CheckInStatus {
  canCheckIn: boolean;
  currentStreak: number;
  daysUntilBonus: number;
  lastCheckIn: string | null;
  todayCheckIn: DailyCheckIn | null;
}

/**
 * Get check-in status for a user
 */
export async function getCheckInStatus(
  userId: string,
  timezone: string = "UTC"
): Promise<CheckInStatus> {
  const todayDate = getCalendarDateInTimezone(new Date(), timezone);
  const checkIns = await getRecentCheckIns(userId, 30);

  // Check if already checked in today
  const todayCheckIn = checkIns.find(c => c.checkInDate === todayDate) || null;
  const canCheckIn = !todayCheckIn;

  // Calculate current streak
  const currentStreak = calculateStreak(checkIns, todayDate);

  // Days until next streak bonus (every 3rd day)
  const daysUntilBonus = currentStreak === 0 ? 3 : (3 - (currentStreak % 3)) % 3 || 3;

  // Get most recent check-in date
  const lastCheckIn = checkIns.length > 0 ? checkIns[0].checkInDate : null;

  return {
    canCheckIn,
    currentStreak,
    daysUntilBonus,
    lastCheckIn,
    todayCheckIn,
  };
}

export interface CheckInResult {
  medalsAwarded: number;
  currentStreak: number;
  isStreakBonus: boolean;
  checkIn: DailyCheckIn;
}

/**
 * Perform daily check-in
 */
export async function performCheckIn(
  userId: string,
  timezone: string = "UTC"
): Promise<CheckInResult> {
  const todayDate = getCalendarDateInTimezone(new Date(), timezone);

  // Check if already checked in today
  const [existingCheckIn] = await db
    .select()
    .from(dailyCheckIns)
    .where(and(
      eq(dailyCheckIns.userId, userId),
      eq(dailyCheckIns.checkInDate, todayDate)
    ));

  if (existingCheckIn) {
    throw new Error("Already checked in today");
  }

  // Get status to calculate streak
  const status = await getCheckInStatus(userId, timezone);

  // New streak day is current streak + 1
  const newStreakDay = status.currentStreak + 1;

  // Check if this is a streak bonus day (every 3rd day)
  const isStreakBonus = newStreakDay % 3 === 0;

  // Determine reward
  let medalsAwarded: number;
  if (isStreakBonus) {
    medalsAwarded = rollStreakBonus();
  } else {
    medalsAwarded = 1;
  }

  // Create check-in record
  const [checkIn] = await db.insert(dailyCheckIns).values({
    userId,
    checkInDate: todayDate,
    medalsAwarded,
    streakDay: newStreakDay,
  }).returning();

  // Award medals
  const description = isStreakBonus
    ? `Streak bonus! Day ${newStreakDay} check-in reward`
    : `Daily check-in reward`;

  await awardMedals(userId, medalsAwarded, "check_in", checkIn.id, description);

  return {
    medalsAwarded,
    currentStreak: newStreakDay,
    isStreakBonus,
    checkIn,
  };
}

// Medal rewards for item rarities
const RARITY_MEDAL_REWARDS: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 5,
  legendary: 8,
  mythic: 0, // Mythic items don't drop from runs
};

/**
 * Calculate medals for item drops from a run
 */
export function calculateMedalsForRarities(rarities: string[]): number {
  return rarities.reduce((total, rarity) => {
    return total + (RARITY_MEDAL_REWARDS[rarity] || 0);
  }, 0);
}

// Medal rewards for character progression
const PROGRESSION_REWARDS: Record<string, number> = {
  "egg_to_hatchling_v1": 1,
  "hatchling_v1_to_hatchling_v2": 2,
  "hatchling_v2_to_child": 2,
  "child_to_adolescent": 3,
  "adolescent_to_young_adult": 5,
  "young_adult_to_mature": 7,
  "mature_to_maxed": 10,
};

/**
 * Get the character stage based on total runs
 */
export function getCharacterStage(totalRuns: number): string {
  if (totalRuns === 0) return "egg";
  if (totalRuns < 3) return "hatchling_v1";
  if (totalRuns < 7) return "hatchling_v2";
  if (totalRuns < 15) return "child";
  if (totalRuns < 30) return "adolescent";
  if (totalRuns < 60) return "young_adult";
  if (totalRuns < 100) return "mature";
  return "maxed";
}

/**
 * Check for and award progression medals
 */
export async function checkProgressionReward(
  userId: string,
  previousTotalRuns: number,
  newTotalRuns: number
): Promise<{ transitionKey: string; medalsAwarded: number } | null> {
  const previousStage = getCharacterStage(previousTotalRuns);
  const newStage = getCharacterStage(newTotalRuns);

  if (previousStage === newStage) {
    return null; // No stage change
  }

  const transitionKey = `${previousStage}_to_${newStage}`;
  const medalsAwarded = PROGRESSION_REWARDS[transitionKey];

  if (!medalsAwarded) {
    return null; // No reward defined for this transition
  }

  await awardMedals(
    userId,
    medalsAwarded,
    "progression",
    undefined,
    `Stage reached: ${newStage.replace(/_/g, ' ')}`
  );

  return { transitionKey, medalsAwarded };
}
