import { db } from "../db";
import { items, runItems, inventory, type Item, type Rarity } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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
 */
export async function getRandomItemByRarity(rarity: Rarity): Promise<Item | null> {
  const matchingItems = await db
    .select()
    .from(items)
    .where(eq(items.rarity, rarity));

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
}

/**
 * Main function: Roll item(s) for a run based on distance
 */
export async function rollItemsForRun(distanceMeters: number): Promise<RollResult> {
  const result: RollResult = { items: [], rarities: [] };

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
 * Stores in both runItems (for history) and inventory (for use)
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
  }
}

/**
 * Process a run for item rewards
 * Returns the items that were awarded
 */
export async function processRunRewards(
  userId: string,
  runId: number,
  distanceMeters: number
): Promise<RollResult> {
  const rollResult = await rollItemsForRun(distanceMeters);

  if (rollResult.items.length > 0) {
    await awardItemsToUser(userId, runId, rollResult.items);
  }

  return rollResult;
}
