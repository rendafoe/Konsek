import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// Import auth models - CRITICAL for Replit Auth
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

// Strava connection details for a user
export const stravaAccounts = pgTable("strava_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  athleteId: varchar("athlete_id").notNull(),
  accessToken: varchar("access_token").notNull(),
  refreshToken: varchar("refresh_token").notNull(),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp
  lastFetchAt: timestamp("last_fetch_at"),
  // Athlete profile info
  athleteFirstName: varchar("athlete_first_name"),
  athleteLastName: varchar("athlete_last_name"),
  athleteProfilePicture: varchar("athlete_profile_picture"),
});

// Character type - now only "esko" for the app mascot
export const SPRITE_TYPES = ["esko"] as const;
export type SpriteType = typeof SPRITE_TYPES[number];

// The user's digital companion (Esko)
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  spriteType: text("sprite_type", { enum: ["esko", "bear", "elk", "hare", "spirit", "troll"] }).default("esko").notNull(),
  status: text("status", { enum: ["alive", "dead"] }).default("alive").notNull(),

  // Health State: 0 = Fully nourished, 1 = Rest, 2 = Weak, 3 = Critical, 4 = Dead
  healthState: integer("health_state").default(0).notNull(),

  // Stats
  daysAlive: integer("days_alive").default(0).notNull(),
  totalDistance: integer("total_distance").default(0).notNull(), // in meters
  totalRuns: integer("total_runs").default(0).notNull(),

  // Consecutive days without a run - health decays after 2 days
  consecutiveRestDays: integer("consecutive_rest_days").default(0).notNull(),

  // Medal balance (integer only)
  medalBalance: integer("medal_balance").default(0).notNull(),

  // User's timezone for accurate date comparisons (e.g., "America/Chicago")
  timezone: text("timezone"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  deathDate: timestamp("death_date"),
});

// Items that can be collected
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity", { enum: ["common", "uncommon", "rare", "epic", "legendary", "mythic"] }).notNull(),
  imageUrl: text("image_url").notNull(), // Path to pixel art asset
  quote: text("quote"), // Flavor text displayed in italics
  isSpecialReward: boolean("is_special_reward").default(false).notNull(), // Special condition-based rewards
  specialRewardCondition: text("special_reward_condition"), // Description of unlock condition
  price: integer("price"), // Medal cost for purchasable items (null = not purchasable)
});

// User inventory (collected items)
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  characterId: integer("character_id").references(() => characters.id), // Current owner (if alive) or null
  equipped: boolean("equipped").default(false).notNull(),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});

// Run logs (synced from Strava)
export const runs = pgTable("runs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  characterId: integer("character_id").references(() => characters.id), // Which character this run contributed to
  stravaActivityId: varchar("strava_activity_id").unique().notNull(),
  distance: integer("distance").notNull(), // in meters
  duration: integer("duration").notNull(), // in seconds
  date: timestamp("date").notNull(),
  processed: boolean("processed").default(false).notNull(), // Has this run been applied to game logic?
  // Additional activity data
  name: text("name"), // Activity title from Strava
  polyline: text("polyline"), // Encoded route for mini-map
  elevationGain: integer("elevation_gain"), // Meters
  healthUpdated: boolean("health_updated").default(false).notNull(), // Was health updated for this run?
});

// Junction table for items awarded from runs
export const runItems = pgTable("run_items", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull().references(() => runs.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
});

// Track first-time item acquisitions for achievements
export const userUnlocks = pgTable("user_unlocks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  itemId: integer("item_id").notNull().references(() => items.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

// Daily check-ins for medal rewards
export const dailyCheckIns = pgTable("daily_check_ins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  checkInDate: date("check_in_date").notNull(), // Calendar date of check-in
  medalsAwarded: integer("medals_awarded").notNull(), // 1 for regular, 3-10 for streak bonus
  streakDay: integer("streak_day").notNull(), // Which day in the current streak
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medal transaction audit trail
export const MEDAL_SOURCES = ["check_in", "item_drop", "progression", "referral", "purchase"] as const;
export type MedalSource = typeof MEDAL_SOURCES[number];

export const medalTransactions = pgTable("medal_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Positive for earned, negative for spent
  source: text("source", { enum: MEDAL_SOURCES }).notNull(),
  sourceId: integer("source_id"), // Reference to run/item/etc.
  description: text("description").notNull(), // Human-readable description
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Referrals (schema only for now - implementation deferred)
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  medalsEarnedFromReferral: integer("medals_earned_from_referral").default(0).notNull(), // Max 25
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// === RELATIONS ===
export const stravaAccountsRelations = relations(stravaAccounts, ({ one }) => ({
  user: one(users, {
    fields: [stravaAccounts.userId],
    references: [users.id],
  }),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  user: one(users, {
    fields: [characters.userId],
    references: [users.id],
  }),
  runs: many(runs),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, {
    fields: [inventory.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [inventory.itemId],
    references: [items.id],
  }),
  character: one(characters, {
    fields: [inventory.characterId],
    references: [characters.id],
  }),
}));

export const runsRelations = relations(runs, ({ one, many }) => ({
  user: one(users, {
    fields: [runs.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [runs.characterId],
    references: [characters.id],
  }),
  awardedItems: many(runItems),
}));

export const runItemsRelations = relations(runItems, ({ one }) => ({
  run: one(runs, {
    fields: [runItems.runId],
    references: [runs.id],
  }),
  item: one(items, {
    fields: [runItems.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [runItems.userId],
    references: [users.id],
  }),
}));

export const userUnlocksRelations = relations(userUnlocks, ({ one }) => ({
  user: one(users, {
    fields: [userUnlocks.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [userUnlocks.itemId],
    references: [items.id],
  }),
}));

export const dailyCheckInsRelations = relations(dailyCheckIns, ({ one }) => ({
  user: one(users, {
    fields: [dailyCheckIns.userId],
    references: [users.id],
  }),
}));

export const medalTransactionsRelations = relations(medalTransactions, ({ one }) => ({
  user: one(users, {
    fields: [medalTransactions.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertCharacterSchema = createInsertSchema(characters).omit({ 
  id: true, 
  userId: true, 
  createdAt: true, 
  deathDate: true,
  healthState: true,
  daysAlive: true,
  totalDistance: true,
  totalRuns: true,
  spriteType: true, // Auto-assigned randomly on server
});

export const insertStravaAccountSchema = createInsertSchema(stravaAccounts).omit({
  id: true,
  userId: true,
  lastFetchAt: true
});

export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, acquiredAt: true });
export const insertRunSchema = createInsertSchema(runs).omit({ id: true });
export const insertRunItemSchema = createInsertSchema(runItems).omit({ id: true, awardedAt: true });
export const insertUserUnlockSchema = createInsertSchema(userUnlocks).omit({ id: true, unlockedAt: true });
export const insertDailyCheckInSchema = createInsertSchema(dailyCheckIns).omit({ id: true, createdAt: true });
export const insertMedalTransactionSchema = createInsertSchema(medalTransactions).omit({ id: true, createdAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });

// === TYPES ===
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Item = typeof items.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect & { item?: Item };
export type Run = typeof runs.$inferSelect;
export type RunItem = typeof runItems.$inferSelect;
export type RunWithItems = Run & { awardedItems?: (RunItem & { item?: Item })[], medalsAwarded?: number };
export type StravaAccount = typeof stravaAccounts.$inferSelect;
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type UserUnlock = typeof userUnlocks.$inferSelect;
export type DailyCheckIn = typeof dailyCheckIns.$inferSelect;
export type MedalTransaction = typeof medalTransactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
