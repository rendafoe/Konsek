import { db } from "./db";
import { eq, desc, and, count, gte, lt } from "drizzle-orm";
import {
  characters, items, inventory, runs, stravaAccounts, runItems, userUnlocks,
  type Character, type InsertCharacter,
  type Item, type InventoryItem,
  type Run, type RunWithItems, type StravaAccount, type RunItem, type UserUnlock,
  SPRITE_TYPES, type SpriteType
} from "@/shared/schema";
import { type User } from "@/shared/models/auth";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AchievementItem extends Item {
  unlocked: boolean;
  unlockedAt: Date | null;
  price: number | null;
}

export interface IStorage {
  // Strava
  getStravaAccount(userId: string): Promise<StravaAccount | undefined>;
  upsertStravaAccount(data: any): Promise<StravaAccount>;

  // Characters
  getActiveCharacter(userId: string): Promise<Character | undefined>;
  getMostRecentCharacter(userId: string): Promise<Character | undefined>;
  getCharacterArchive(userId: string): Promise<Character[]>;
  createCharacter(data: InsertCharacter & { userId: string }): Promise<Character>;
  updateCharacter(id: number, updates: Partial<Character>): Promise<Character>;

  // Items & Inventory
  getAllItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  getInventory(userId: string): Promise<InventoryItem[]>;
  addItemToInventory(userId: string, itemId: number): Promise<void>;
  equipItem(userId: string, inventoryId: number): Promise<void>;
  unequipItem(userId: string, inventoryId: number): Promise<void>;
  createItem(data: Omit<Item, "id">): Promise<Item>;

  // Runs
  createRun(data: any): Promise<Run>;
  getRuns(userId: string): Promise<Run[]>;
  getRun(id: number): Promise<Run | undefined>;
  updateRun(id: number, updates: Partial<Run>): Promise<Run>;
  getActivitiesPaginated(userId: string, page: number, limit: number): Promise<PaginatedResult<RunWithItems>>;
  hasRunOnDate(userId: string, date: Date): Promise<boolean>;

  // Run Items
  getRunItems(runId: number): Promise<(RunItem & { item: Item })[]>;

  // Achievements
  getAchievements(userId: string): Promise<AchievementItem[]>;
}

export class DatabaseStorage implements IStorage {
  // Strava
  async getStravaAccount(userId: string): Promise<StravaAccount | undefined> {
    const [account] = await db.select().from(stravaAccounts).where(eq(stravaAccounts.userId, userId));
    return account;
  }

  async upsertStravaAccount(data: any): Promise<StravaAccount> {
    const [account] = await db
      .insert(stravaAccounts)
      .values(data)
      .onConflictDoUpdate({
        target: stravaAccounts.userId,
        set: data,
      })
      .returning();
    return account;
  }

  // Characters
  async getActiveCharacter(userId: string): Promise<Character | undefined> {
    const [character] = await db.select()
      .from(characters)
      .where(and(eq(characters.userId, userId), eq(characters.status, "alive")));
    return character;
  }

  // Get most recent character regardless of status (for displaying dead character info)
  async getMostRecentCharacter(userId: string): Promise<Character | undefined> {
    const [character] = await db.select()
      .from(characters)
      .where(eq(characters.userId, userId))
      .orderBy(desc(characters.createdAt))
      .limit(1);
    return character;
  }

  async getCharacterArchive(userId: string): Promise<Character[]> {
    return await db.select()
      .from(characters)
      .where(and(eq(characters.userId, userId), eq(characters.status, "dead")))
      .orderBy(desc(characters.createdAt));
  }

  async createCharacter(data: InsertCharacter & { userId: string }): Promise<Character> {
    // All characters are now Esko - the app mascot
    const [character] = await db.insert(characters).values({
      ...data,
      spriteType: "esko",
    }).returning();
    return character;
  }

  async updateCharacter(id: number, updates: Partial<Character>): Promise<Character> {
    const [updated] = await db.update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    return updated;
  }

  // Items
  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getInventory(userId: string): Promise<InventoryItem[]> {
    const result = await db.select({
      id: inventory.id,
      userId: inventory.userId,
      itemId: inventory.itemId,
      characterId: inventory.characterId,
      equipped: inventory.equipped,
      acquiredAt: inventory.acquiredAt,
      item: items
    })
    .from(inventory)
    .leftJoin(items, eq(inventory.itemId, items.id))
    .where(eq(inventory.userId, userId));

    return result.map(r => ({
      ...r,
      item: r.item ?? undefined
    }));
  }

  async addItemToInventory(userId: string, itemId: number): Promise<void> {
    await db.insert(inventory).values({
        userId,
        itemId,
        equipped: false
    });
  }

  async equipItem(userId: string, inventoryId: number): Promise<void> {
    await db.update(inventory)
        .set({ equipped: true })
        .where(and(eq(inventory.id, inventoryId), eq(inventory.userId, userId)));
  }

  async unequipItem(userId: string, inventoryId: number): Promise<void> {
    await db.update(inventory)
        .set({ equipped: false })
        .where(and(eq(inventory.id, inventoryId), eq(inventory.userId, userId)));
  }

  // Items
  async createItem(data: Omit<Item, "id">): Promise<Item> {
    const [item] = await db.insert(items).values(data).returning();
    return item;
  }

  // Runs
  async createRun(data: any): Promise<Run> {
    const [run] = await db.insert(runs).values(data).returning();
    return run;
  }

  async getRuns(userId: string): Promise<Run[]> {
    return await db.select().from(runs).where(eq(runs.userId, userId)).orderBy(desc(runs.date));
  }

  async getRun(id: number): Promise<Run | undefined> {
    const [run] = await db.select().from(runs).where(eq(runs.id, id));
    return run;
  }

  async updateRun(id: number, updates: Partial<Run>): Promise<Run> {
    const [updated] = await db.update(runs)
      .set(updates)
      .where(eq(runs.id, id))
      .returning();
    return updated;
  }

  async getActivitiesPaginated(userId: string, page: number, limit: number): Promise<PaginatedResult<RunWithItems>> {
    const offset = (page - 1) * limit;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(runs)
      .where(eq(runs.userId, userId));

    // Get paginated runs
    const runList = await db
      .select()
      .from(runs)
      .where(eq(runs.userId, userId))
      .orderBy(desc(runs.date))
      .limit(limit)
      .offset(offset);

    // Get items for each run
    const runsWithItems: RunWithItems[] = await Promise.all(
      runList.map(async (run) => {
        const awardedItems = await this.getRunItems(run.id);
        return { ...run, awardedItems };
      })
    );

    return {
      data: runsWithItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async hasRunOnDate(userId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [existing] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(
        and(
          eq(runs.userId, userId),
          gte(runs.date, startOfDay),
          lt(runs.date, endOfDay),
          eq(runs.healthUpdated, true)
        )
      )
      .limit(1);

    return !!existing;
  }

  // Run Items
  async getRunItems(runId: number): Promise<(RunItem & { item: Item })[]> {
    const result = await db
      .select({
        id: runItems.id,
        runId: runItems.runId,
        itemId: runItems.itemId,
        userId: runItems.userId,
        awardedAt: runItems.awardedAt,
        item: items,
      })
      .from(runItems)
      .leftJoin(items, eq(runItems.itemId, items.id))
      .where(eq(runItems.runId, runId));

    return result.map((r) => ({
      id: r.id,
      runId: r.runId,
      itemId: r.itemId,
      userId: r.userId,
      awardedAt: r.awardedAt,
      item: r.item as Item,
    }));
  }

  // Achievements - get all items with unlock status for a user
  async getAchievements(userId: string): Promise<AchievementItem[]> {
    // Get all items ordered alphabetically
    const allItems = await db.select().from(items).orderBy(items.name);

    // Get user's unlocks
    const unlocks = await db
      .select()
      .from(userUnlocks)
      .where(eq(userUnlocks.userId, userId));

    // Create a map of itemId -> unlockedAt
    const unlockMap = new Map(unlocks.map(u => [u.itemId, u.unlockedAt]));

    // Combine items with unlock status
    return allItems.map(item => ({
      ...item,
      unlocked: unlockMap.has(item.id),
      unlockedAt: unlockMap.get(item.id) || null,
    }));
  }
}

export const storage = new DatabaseStorage();
