import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { 
  characters, items, inventory, runs, stravaAccounts,
  type Character, type InsertCharacter,
  type Item, type InventoryItem,
  type Run, type StravaAccount,
  SPRITE_TYPES, type SpriteType
} from "@shared/schema";
import { type User } from "@shared/models/auth";

export interface IStorage {
  // Strava
  getStravaAccount(userId: string): Promise<StravaAccount | undefined>;
  upsertStravaAccount(data: any): Promise<StravaAccount>;
  
  // Characters
  getActiveCharacter(userId: string): Promise<Character | undefined>;
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
  
  // Runs
  createRun(data: any): Promise<Run>;
  getRuns(userId: string): Promise<Run[]>;
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

  async getCharacterArchive(userId: string): Promise<Character[]> {
    return await db.select()
      .from(characters)
      .where(and(eq(characters.userId, userId), eq(characters.status, "dead")))
      .orderBy(desc(characters.createdAt));
  }

  async createCharacter(data: InsertCharacter & { userId: string }): Promise<Character> {
    const randomSprite = SPRITE_TYPES[Math.floor(Math.random() * SPRITE_TYPES.length)];
    const [character] = await db.insert(characters).values({
      ...data,
      spriteType: randomSprite,
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
    return await db.select({
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
  }

  async addItemToInventory(userId: string, itemId: number): Promise<void> {
    await db.insert(inventory).values({
        userId,
        itemId,
        equipped: false
    });
  }

  async equipItem(userId: string, inventoryId: number): Promise<void> {
    // Logic: First unequip item of same type? Or just set equipped=true?
    // For simplicity, just set equipped=true. Complex logic (slots) can be handled later.
    await db.update(inventory)
        .set({ equipped: true })
        .where(and(eq(inventory.id, inventoryId), eq(inventory.userId, userId)));
  }

  async unequipItem(userId: string, inventoryId: number): Promise<void> {
    await db.update(inventory)
        .set({ equipped: false })
        .where(and(eq(inventory.id, inventoryId), eq(inventory.userId, userId)));
  }

  // Runs
  async createRun(data: any): Promise<Run> {
    const [run] = await db.insert(runs).values(data).returning();
    return run;
  }
  
  async getRuns(userId: string): Promise<Run[]> {
      return await db.select().from(runs).where(eq(runs.userId, userId)).orderBy(desc(runs.date));
  }
}

export const storage = new DatabaseStorage();
