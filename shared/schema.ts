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
  userId: varchar("user_id").notNull().references(() => users.id),
  athleteId: varchar("athlete_id").notNull(),
  accessToken: varchar("access_token").notNull(),
  refreshToken: varchar("refresh_token").notNull(),
  expiresAt: integer("expires_at").notNull(), // Unix timestamp
  lastFetchAt: timestamp("last_fetch_at"),
});

// Available sprite types for companions
export const SPRITE_TYPES = ["bear", "elk", "hare", "otter", "spirit", "troll"] as const;
export type SpriteType = typeof SPRITE_TYPES[number];

// The user's digital companion
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  spriteType: text("sprite_type", { enum: ["bear", "elk", "hare", "otter", "spirit", "troll"] }).notNull(),
  status: text("status", { enum: ["alive", "dead"] }).default("alive").notNull(),
  
  // Health State: 0 = Fully nourished, 1 = Rest, 2 = Weak, 3 = Critical, 4 = Dead
  healthState: integer("health_state").default(0).notNull(),
  
  // Stats
  daysAlive: integer("days_alive").default(0).notNull(),
  totalDistance: integer("total_distance").default(0).notNull(), // in meters
  totalRuns: integer("total_runs").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deathDate: timestamp("death_date"),
});

// Items that can be collected
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity", { enum: ["common", "uncommon", "rare", "epic", "legendary"] }).notNull(),
  type: text("type", { enum: ["wearable", "accessory"] }).notNull(),
  imageUrl: text("image_url").notNull(), // Path to pixel art asset
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

export const runsRelations = relations(runs, ({ one }) => ({
  user: one(users, {
    fields: [runs.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [runs.characterId],
    references: [characters.id],
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

// === TYPES ===
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Item = typeof items.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect & { item?: Item };
export type Run = typeof runs.$inferSelect;
export type StravaAccount = typeof stravaAccounts.$inferSelect;
