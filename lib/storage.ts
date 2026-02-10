import { db } from "./db";
import { eq, desc, asc, and, count, gte, lt, notInArray, inArray, sql, ilike, or } from "drizzle-orm";
import {
  characters, items, inventory, runs, stravaAccounts, runItems, userUnlocks,
  friends, referrals,
  type Character, type InsertCharacter,
  type Item, type InventoryItem,
  type Run, type RunWithItems, type StravaAccount, type RunItem, type UserUnlock,
  type FriendProfile, type DiscoverableUser, type Referral,
  SPRITE_TYPES, type SpriteType
} from "@/shared/schema";
import { type User } from "@/shared/models/auth";
import { getCharacterStage, STAGE_DISPLAY_NAMES } from "./services/medalService";

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

  // Referrals
  getReferralByReferredUser(referredUserId: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  createReferral(referrerId: string, referredUserId: string): Promise<Referral>;
  updateReferralMedals(referralId: number, newTotal: number): Promise<void>;
  getReferralCount(referrerId: string): Promise<number>;
  getReferrerByFriendCode(friendCode: string): Promise<{ userId: string; displayName: string } | undefined>;

  // Friends
  getFriendsWithProfiles(userId: string): Promise<FriendProfile[]>;
  getDiscoverableUsers(userId: string, page: number, limit: number, search?: string, sort?: string): Promise<PaginatedResult<DiscoverableUser>>;
  addFriendFromDiscover(userId: string, targetUserId: string): Promise<void>;
  addFriendByCode(userId: string, friendCode: string): Promise<void>;
  removeFriend(userId: string, stravaAthleteId: string): Promise<void>;
  getOrCreateFriendCode(userId: string): Promise<string>;
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
  // === REFERRALS ===

  async getReferralByReferredUser(referredUserId: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId));
    return referral;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return await db.select().from(referrals).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
  }

  async createReferral(referrerId: string, referredUserId: string): Promise<Referral> {
    const [referral] = await db.insert(referrals).values({
      referrerId,
      referredUserId,
      medalsEarnedFromReferral: 0,
    }).returning();
    return referral;
  }

  async updateReferralMedals(referralId: number, newTotal: number): Promise<void> {
    await db.update(referrals)
      .set({ medalsEarnedFromReferral: newTotal })
      .where(eq(referrals.id, referralId));
  }

  async getReferralCount(referrerId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));
    return total;
  }

  async getReferrerByFriendCode(friendCode: string): Promise<{ userId: string; displayName: string } | undefined> {
    const normalized = friendCode.replace(/-/g, "").toUpperCase();
    const [account] = await db.select().from(stravaAccounts)
      .where(eq(stravaAccounts.friendCode, normalized));
    if (!account) return undefined;
    const displayName = [account.athleteFirstName, account.athleteLastName].filter(Boolean).join(" ") || "Unknown";
    return { userId: account.userId, displayName };
  }

  // === FRIENDS ===

  async getFriendsWithProfiles(userId: string): Promise<FriendProfile[]> {
    // 1. Fetch all friends for this user
    const friendRows = await db.select().from(friends).where(eq(friends.userId, userId));
    if (friendRows.length === 0) return [];

    const athleteIds = friendRows.map(f => f.stravaAthleteId);

    // 2. Batch-fetch matching stravaAccounts to find Konsek users
    const konsekAccounts = await db.select().from(stravaAccounts)
      .where(inArray(stravaAccounts.athleteId, athleteIds));
    const konsekMap = new Map(konsekAccounts.map(a => [a.athleteId, a]));

    // 3. For Konsek users, batch-fetch characters, unlock counts, last item
    const konsekUserIds = konsekAccounts.map(a => a.userId);
    let characterMap = new Map<string, Character>();
    let unlockCountMap = new Map<string, number>();
    let lastItemMap = new Map<string, { name: string; imageUrl: string; rarity: string; receivedAt: string }>();

    if (konsekUserIds.length > 0) {
      // Active characters
      const chars = await db.select().from(characters)
        .where(and(
          inArray(characters.userId, konsekUserIds),
          eq(characters.status, "alive")
        ));
      characterMap = new Map(chars.map(c => [c.userId, c]));

      // Unlock counts
      const unlockResults = await db.select({
        userId: userUnlocks.userId,
        count: count(),
      }).from(userUnlocks)
        .where(inArray(userUnlocks.userId, konsekUserIds))
        .groupBy(userUnlocks.userId);
      unlockCountMap = new Map(unlockResults.map(r => [r.userId, r.count]));

      // Last item received (most recent runItem per user)
      for (const uid of konsekUserIds) {
        const [lastRunItem] = await db.select({
          name: items.name,
          imageUrl: items.imageUrl,
          rarity: items.rarity,
          awardedAt: runItems.awardedAt,
        }).from(runItems)
          .leftJoin(items, eq(runItems.itemId, items.id))
          .where(eq(runItems.userId, uid))
          .orderBy(desc(runItems.awardedAt))
          .limit(1);

        if (lastRunItem && lastRunItem.name) {
          lastItemMap.set(uid, {
            name: lastRunItem.name,
            imageUrl: lastRunItem.imageUrl!,
            rarity: lastRunItem.rarity!,
            receivedAt: lastRunItem.awardedAt.toISOString(),
          });
        }
      }
    }

    // 4. Assemble FriendProfile objects
    const profiles: FriendProfile[] = friendRows.map(f => {
      const konsekAccount = konsekMap.get(f.stravaAthleteId);
      const isKonsekUser = !!konsekAccount;

      if (isKonsekUser && konsekAccount) {
        const char = characterMap.get(konsekAccount.userId);
        const unlockCount = unlockCountMap.get(konsekAccount.userId) ?? 0;
        const lastItem = lastItemMap.get(konsekAccount.userId) ?? null;
        const stage = char ? getCharacterStage(char.totalRuns) : null;

        return {
          displayName: f.displayName,
          profilePicture: f.profilePicture,
          isKonsekUser: true,
          stravaAthleteId: f.stravaAthleteId,
          totalRuns: char?.totalRuns ?? null,
          totalDistance: char?.totalDistance ?? null,
          eskoStage: stage ? (STAGE_DISPLAY_NAMES[stage] || stage) : null,
          eskoHealthState: char?.healthState ?? null,
          totalMedals: char?.medalBalance ?? null,
          totalItemsUnlocked: unlockCount,
          lastItemReceived: lastItem,
          source: f.source as "club" | "code",
          friendSince: f.createdAt.toISOString(),
        };
      }

      return {
        displayName: f.displayName,
        profilePicture: f.profilePicture,
        isKonsekUser: false,
        stravaAthleteId: f.stravaAthleteId,
        totalRuns: null,
        totalDistance: null,
        eskoStage: null,
        eskoHealthState: null,
        totalMedals: null,
        totalItemsUnlocked: null,
        lastItemReceived: null,
        source: f.source as "club" | "code",
        friendSince: f.createdAt.toISOString(),
      };
    });

    // 5. Sort: Konsek users first (alpha), then non-Konsek (alpha)
    profiles.sort((a, b) => {
      if (a.isKonsekUser && !b.isKonsekUser) return -1;
      if (!a.isKonsekUser && b.isKonsekUser) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return profiles;
  }

  async getDiscoverableUsers(userId: string, page: number, limit: number, search?: string, sort: string = "name"): Promise<PaginatedResult<DiscoverableUser>> {
    const offset = (page - 1) * limit;

    // Get existing friend athlete IDs to exclude
    const existingFriends = await db.select({ stravaAthleteId: friends.stravaAthleteId })
      .from(friends).where(eq(friends.userId, userId));
    const friendAthleteIds = existingFriends.map(f => f.stravaAthleteId);

    // Build base conditions: exclude self
    const baseConditions = [
      sql`${stravaAccounts.userId} != ${userId}`,
    ];

    // Exclude already-friended users
    if (friendAthleteIds.length > 0) {
      baseConditions.push(
        sql`${stravaAccounts.athleteId} NOT IN (${sql.join(friendAthleteIds.map(id => sql`${id}`), sql`, `)})`
      );
    }

    // Search filter
    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [
        sql`LOWER(COALESCE(${stravaAccounts.athleteFirstName}, '') || ' ' || COALESCE(${stravaAccounts.athleteLastName}, '')) LIKE LOWER(${'%' + term + '%'})`,
      ];
      // If it looks like a friend code (alphanumeric, 4-8 chars), also match prefix
      const normalized = term.replace(/-/g, "").toUpperCase();
      if (/^[A-Z0-9]{2,8}$/.test(normalized)) {
        searchConditions.push(
          sql`UPPER(${stravaAccounts.friendCode}) LIKE ${normalized + '%'}`
        );
      }
      baseConditions.push(sql`(${sql.join(searchConditions, sql` OR `)})`);
    }

    const whereClause = sql`${sql.join(baseConditions, sql` AND `)}`;

    // Count total
    const [{ total }] = await db
      .select({ total: count() })
      .from(stravaAccounts)
      .leftJoin(characters, and(
        eq(characters.userId, stravaAccounts.userId),
        eq(characters.status, "alive")
      ))
      .where(whereClause);

    // Sort
    let orderBy;
    switch (sort) {
      case "distance":
        orderBy = sql`COALESCE(${characters.totalDistance}, 0) DESC, LOWER(COALESCE(${stravaAccounts.athleteFirstName}, ''))`;
        break;
      case "medals":
        orderBy = sql`COALESCE(${characters.medalBalance}, 0) DESC, LOWER(COALESCE(${stravaAccounts.athleteFirstName}, ''))`;
        break;
      case "runs":
        orderBy = sql`COALESCE(${characters.totalRuns}, 0) DESC, LOWER(COALESCE(${stravaAccounts.athleteFirstName}, ''))`;
        break;
      case "esko_age":
        orderBy = sql`COALESCE(${characters.createdAt}, NOW()) ASC, LOWER(COALESCE(${stravaAccounts.athleteFirstName}, ''))`;
        break;
      default: // "name"
        orderBy = sql`LOWER(COALESCE(${stravaAccounts.athleteFirstName}, '') || ' ' || COALESCE(${stravaAccounts.athleteLastName}, ''))`;
        break;
    }

    // Query
    const rows = await db
      .select({
        userId: stravaAccounts.userId,
        stravaAthleteId: stravaAccounts.athleteId,
        athleteFirstName: stravaAccounts.athleteFirstName,
        athleteLastName: stravaAccounts.athleteLastName,
        profilePicture: stravaAccounts.athleteProfilePicture,
        friendCode: stravaAccounts.friendCode,
        totalRuns: characters.totalRuns,
        totalDistance: characters.totalDistance,
        medalBalance: characters.medalBalance,
        eskoCreatedAt: characters.createdAt,
      })
      .from(stravaAccounts)
      .leftJoin(characters, and(
        eq(characters.userId, stravaAccounts.userId),
        eq(characters.status, "alive")
      ))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const users: DiscoverableUser[] = rows.map(r => {
      const totalRuns = r.totalRuns ?? 0;
      const stage = totalRuns > 0 || r.eskoCreatedAt ? getCharacterStage(totalRuns) : null;
      return {
        userId: r.userId,
        stravaAthleteId: r.stravaAthleteId,
        displayName: [r.athleteFirstName, r.athleteLastName].filter(Boolean).join(" ") || "Unknown",
        profilePicture: r.profilePicture,
        friendCode: r.friendCode,
        totalRuns,
        totalDistance: r.totalDistance ?? 0,
        medalBalance: r.medalBalance ?? 0,
        eskoStage: stage ? (STAGE_DISPLAY_NAMES[stage] || stage) : null,
        eskoCreatedAt: r.eskoCreatedAt?.toISOString() ?? null,
      };
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addFriendFromDiscover(userId: string, targetUserId: string): Promise<void> {
    // Look up both users' Strava accounts
    const ownAccount = await this.getStravaAccount(userId);
    if (!ownAccount) throw new Error("You must connect Strava first");

    const [targetAccount] = await db.select().from(stravaAccounts)
      .where(eq(stravaAccounts.userId, targetUserId));
    if (!targetAccount) throw new Error("User not found");
    if (targetAccount.userId === userId) throw new Error("You can't add yourself");

    const targetDisplayName = [targetAccount.athleteFirstName, targetAccount.athleteLastName].filter(Boolean).join(" ") || "Unknown";
    const ownDisplayName = [ownAccount.athleteFirstName, ownAccount.athleteLastName].filter(Boolean).join(" ") || "Unknown";

    // Insert bidirectional: userId → target, target → userId
    await db.insert(friends).values({
      userId,
      stravaAthleteId: targetAccount.athleteId,
      displayName: targetDisplayName,
      profilePicture: targetAccount.athleteProfilePicture,
      source: "discover",
    }).onConflictDoNothing();

    await db.insert(friends).values({
      userId: targetAccount.userId,
      stravaAthleteId: ownAccount.athleteId,
      displayName: ownDisplayName,
      profilePicture: ownAccount.athleteProfilePicture,
      source: "discover",
    }).onConflictDoNothing();
  }

  async addFriendByCode(userId: string, friendCode: string): Promise<void> {
    // Normalize: remove dashes and uppercase
    const normalized = friendCode.replace(/-/g, "").toUpperCase();

    // Look up the strava account by friend code
    const [targetAccount] = await db.select().from(stravaAccounts)
      .where(eq(stravaAccounts.friendCode, normalized));

    if (!targetAccount) throw new Error("Friend code not found");
    if (targetAccount.userId === userId) throw new Error("You can't add yourself");

    // Get current user's strava account for reverse insertion
    const ownAccount = await this.getStravaAccount(userId);
    if (!ownAccount) throw new Error("You must connect Strava first");

    const targetDisplayName = [targetAccount.athleteFirstName, targetAccount.athleteLastName].filter(Boolean).join(" ") || "Unknown";
    const ownDisplayName = [ownAccount.athleteFirstName, ownAccount.athleteLastName].filter(Boolean).join(" ") || "Unknown";

    // Insert bidirectional: userId → target, target → userId
    await db.insert(friends).values({
      userId,
      stravaAthleteId: targetAccount.athleteId,
      displayName: targetDisplayName,
      profilePicture: targetAccount.athleteProfilePicture,
      source: "code",
    }).onConflictDoNothing();

    await db.insert(friends).values({
      userId: targetAccount.userId,
      stravaAthleteId: ownAccount.athleteId,
      displayName: ownDisplayName,
      profilePicture: ownAccount.athleteProfilePicture,
      source: "code",
    }).onConflictDoNothing();
  }

  async removeFriend(userId: string, stravaAthleteId: string): Promise<void> {
    await db.delete(friends).where(and(
      eq(friends.userId, userId),
      eq(friends.stravaAthleteId, stravaAthleteId),
    ));
  }

  async getOrCreateFriendCode(userId: string): Promise<string> {
    const account = await this.getStravaAccount(userId);
    if (!account) throw new Error("Strava not connected");

    if (account.friendCode) return account.friendCode;

    // Generate unique 8-char code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code: string;
    let attempts = 0;
    do {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      // Check uniqueness
      const [existing] = await db.select({ id: stravaAccounts.id }).from(stravaAccounts)
        .where(eq(stravaAccounts.friendCode, code)).limit(1);
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    await db.update(stravaAccounts)
      .set({ friendCode: code })
      .where(eq(stravaAccounts.userId, userId));

    return code;
  }
}

export const storage = new DatabaseStorage();
