import { db } from "@/lib/db";
import { items, runItems, inventory, userUnlocks, type Item, type Rarity } from "@/shared/schema";
import { eq, and } from "drizzle-orm";
import { checkWeatherConditions, type WeatherCheckResult } from "@/lib/services/weatherService";

// Distance-based rarity probability tables
// Each array: [common, uncommon, rare, epic, legendary]
const PROBABILITY_TABLES: Record<string, number[]> = {
  "1-5":    [68, 24, 6, 1.5, 0.5],
  "5-10":   [55, 25, 13, 5, 2],
  "10-15":  [45, 25, 18, 8, 4],
  "15-20":  [35, 25, 22, 12, 6],
  "20-30":  [25, 25, 28, 15, 7],
  "30-40":  [18, 22, 30, 18, 12],
  "40-50":  [10, 20, 32, 22, 16],
};

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

/**
 * Get distance bucket key for probability lookup
 */
export function getDistanceBucket(meters: number): string {
  const km = meters / 1000;

  if (km < 1) return ""; // No reward for < 1km
  if (km < 5) return "1-5";
  if (km < 10) return "5-10";
  if (km < 15) return "10-15";
  if (km < 20) return "15-20";
  if (km < 30) return "20-30";
  if (km < 40) return "30-40";
  return "40-50"; // 40km+ uses the 40-50 table
}

/**
 * Roll a rarity based on weighted probabilities
 */
export function rollRarity(probabilities: number[]): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (roll < cumulative) {
      return RARITIES[i];
    }
  }

  return "common"; // Fallback
}

/**
 * Get a random item of a specific rarity from the database
 * Excludes special reward items from normal rolls
 */
export async function getRandomItemByRarity(rarity: Rarity): Promise<Item | null> {
  const matchingItems = await db
    .select()
    .from(items)
    .where(and(
      eq(items.rarity, rarity),
      eq(items.isSpecialReward, false)
    ));

  if (matchingItems.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * matchingItems.length);
  return matchingItems[randomIndex];
}

/**
 * Roll for high-distance guarantees (50k+ and 100k+)
 * Returns additional guaranteed items
 */
async function rollGuaranteedItems(meters: number): Promise<Item[]> {
  const km = meters / 1000;
  const guaranteed: Item[] = [];

  // 50k+: Guaranteed Epic + 1 additional roll (Rare/Epic/Legendary only)
  if (km >= 50) {
    const epicItem = await getRandomItemByRarity("epic");
    if (epicItem) guaranteed.push(epicItem);

    // Additional roll from rare/epic/legendary only
    const additionalRarities: Rarity[] = ["rare", "epic", "legendary"];
    const additionalProbabilities = [50, 35, 15]; // Weighted toward rare
    const additionalRarity = rollRarityFromSubset(additionalProbabilities, additionalRarities);
    const additionalItem = await getRandomItemByRarity(additionalRarity);
    if (additionalItem) guaranteed.push(additionalItem);
  }

  // 100k+: Guaranteed Legendary + 2 additional rolls (Rare/Epic/Legendary only)
  if (km >= 100) {
    const legendaryItem = await getRandomItemByRarity("legendary");
    if (legendaryItem) guaranteed.push(legendaryItem);

    // Two more rolls from rare/epic/legendary
    const additionalRarities: Rarity[] = ["rare", "epic", "legendary"];
    const additionalProbabilities = [50, 35, 15];

    for (let i = 0; i < 2; i++) {
      const rarity = rollRarityFromSubset(additionalProbabilities, additionalRarities);
      const item = await getRandomItemByRarity(rarity);
      if (item) guaranteed.push(item);
    }
  }

  return guaranteed;
}

/**
 * Roll from a subset of rarities with custom probabilities
 */
function rollRarityFromSubset(probabilities: number[], rarities: Rarity[]): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (roll < cumulative) {
      return rarities[i];
    }
  }

  return rarities[0];
}

export interface RollResult {
  items: Item[];
  rarities: Rarity[];
  medalsAwarded: number;
}

/**
 * Main function: Roll item(s) for a run based on distance
 */
export async function rollItemsForRun(distanceMeters: number): Promise<RollResult> {
  const result: RollResult = { items: [], rarities: [], medalsAwarded: 0 };

  // Must be at least 1km to get rewards
  if (distanceMeters < 1000) {
    return result;
  }

  // Get the probability table for this distance
  const bucket = getDistanceBucket(distanceMeters);
  if (!bucket) return result;

  const probabilities = PROBABILITY_TABLES[bucket];

  // Roll the standard weighted drop
  const rarity = rollRarity(probabilities);
  const item = await getRandomItemByRarity(rarity);

  if (item) {
    result.items.push(item);
    result.rarities.push(rarity);
  }

  // Check for guaranteed high-distance drops
  const guaranteedItems = await rollGuaranteedItems(distanceMeters);
  for (const gItem of guaranteedItems) {
    result.items.push(gItem);
    result.rarities.push(gItem.rarity as Rarity);
  }

  return result;
}

/**
 * Award items from a run to a user
 * Stores in runItems (history), inventory (use), and userUnlocks (achievements)
 */
export async function awardItemsToUser(
  userId: string,
  runId: number,
  awardedItems: Item[]
): Promise<void> {
  for (const item of awardedItems) {
    // Add to runItems for activity log display
    await db.insert(runItems).values({
      runId,
      itemId: item.id,
      userId,
    });

    // Add to inventory for equipping
    await db.insert(inventory).values({
      userId,
      itemId: item.id,
      equipped: false,
    });

    // Track unlock for achievements (ignore if already unlocked)
    try {
      await db.insert(userUnlocks).values({
        userId,
        itemId: item.id,
      });
    } catch {
      // Ignore duplicate key errors - item already unlocked
    }
  }
}

interface SpecialRewardContext {
  polyline: string | null;
  runDate: Date;
  distanceMeters: number;
}

/**
 * Check which special rewards should be awarded for a run
 * Special rewards are only awarded once per user
 */
async function checkSpecialRewards(
  userId: string,
  context: SpecialRewardContext
): Promise<Item[]> {
  const awards: Item[] = [];

  // Get all special reward items
  const specialItems = await db
    .select()
    .from(items)
    .where(eq(items.isSpecialReward, true));

  if (specialItems.length === 0) return awards;

  // Get user's existing unlocks to avoid awarding twice
  const existingUnlocks = await db
    .select({ itemId: userUnlocks.itemId })
    .from(userUnlocks)
    .where(eq(userUnlocks.userId, userId));
  const unlockedIds = new Set(existingUnlocks.map(u => u.itemId));

  // Get weather conditions for the run
  const weather = await checkWeatherConditions(context.polyline, context.runDate);

  // Parse run time details
  const runHour = context.runDate.getHours();
  const runMonth = context.runDate.getMonth() + 1; // 0-indexed
  const runDay = context.runDate.getDate();
  const distanceKm = context.distanceMeters / 1000;

  for (const item of specialItems) {
    // Skip if already unlocked
    if (unlockedIds.has(item.id)) continue;

    const condition = item.specialRewardCondition;
    if (!condition) continue;

    let shouldAward = false;

    // Check each condition type
    if (condition.includes("temp > 100") && weather.isHot) {
      shouldAward = true;
    } else if (condition.includes("temp < 10") && weather.isCold) {
      shouldAward = true;
    } else if (condition.includes("snowing") && weather.isSnowing) {
      shouldAward = true;
    } else if (condition.includes("raining") && weather.isRaining) {
      shouldAward = true;
    } else if (condition.includes("before 6am") && runHour < 6) {
      shouldAward = true;
    } else if (condition.includes("after 10pm") && runHour >= 22) {
      shouldAward = true;
    } else if (condition.includes("Feb 14") && runMonth === 2 && runDay === 14) {
      shouldAward = true;
    } else if (condition.includes("> 100km") && distanceKm > 100) {
      shouldAward = true;
    }

    if (shouldAward) {
      console.log(`Special reward unlocked: ${item.name} (condition: ${condition})`);
      awards.push(item);
    }
  }

  return awards;
}

/**
 * Process a run for item rewards
 * Returns the items that were awarded (including special rewards) and medals
 */
export async function processRunRewards(
  userId: string,
  runId: number,
  distanceMeters: number,
  polyline: string | null = null,
  runDate: Date = new Date()
): Promise<RollResult> {
  const rollResult = await rollItemsForRun(distanceMeters);

  // Check for special rewards (awarded on top of normal rolls)
  const specialRewards = await checkSpecialRewards(userId, {
    polyline,
    runDate,
    distanceMeters,
  });

  // Combine all items
  const allItems = [...rollResult.items, ...specialRewards];
  const allRarities = [
    ...rollResult.rarities,
    ...specialRewards.map(i => i.rarity as Rarity)
  ];

  if (allItems.length > 0) {
    await awardItemsToUser(userId, runId, allItems);
  }

  // Calculate and award medals for item drops
  let medalsAwarded = 0;
  console.log(`[ItemRewards] allRarities: ${JSON.stringify(allRarities)}`);
  if (allRarities.length > 0) {
    const { calculateMedalsForRarities, awardMedals } = await import("./medalService");
    medalsAwarded = calculateMedalsForRarities(allRarities);
    console.log(`[ItemRewards] Calculated medals: ${medalsAwarded} for rarities: ${allRarities.join(', ')}`);

    if (medalsAwarded > 0) {
      try {
        await awardMedals(
          userId,
          medalsAwarded,
          "item_drop",
          runId,
          `Item drops from run: ${allRarities.join(', ')}`
        );
        console.log(`[ItemRewards] Medals awarded successfully: ${medalsAwarded}`);
      } catch (error) {
        console.error(`[ItemRewards] Failed to award medals:`, error);
      }
    }
  }

  return { items: allItems, rarities: allRarities, medalsAwarded };
}
