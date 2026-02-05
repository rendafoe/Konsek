import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";

// Dev mode check
const isDevMode = process.env.NODE_ENV === 'development' && !process.env.REPL_ID;

// Mock user for local development
const devUser = {
  claims: { sub: 'dev-user-1', email: 'dev@local.test', first_name: 'Dev', last_name: 'User' },
  expires_at: Math.floor(Date.now() / 1000) + 86400
};

// Simple auth middleware for dev mode
const devAuth: RequestHandler = (req, res, next) => {
  (req as any).user = devUser;
  (req as any).isAuthenticated = () => true;
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup - skip Replit auth in local dev mode
  if (isDevMode) {
    console.log('🔧 Running in local dev mode - using mock authentication');
    app.use(session({
      secret: 'dev-secret-key',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
    }));

    // Mock auth user endpoint - returns user only if "logged in"
    app.get("/api/auth/user", (req: any, res) => {
      if (req.session.isLoggedIn) {
        res.json({
          id: 'dev-user-1',
          email: 'dev@local.test',
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        res.status(401).json({ message: "Not authenticated" });
      }
    });

    // Mock login - creates dev user in DB, sets session, and redirects home
    app.get("/api/login", async (req: any, res) => {
      try {
        // Import authStorage and create the dev user in the database
        const { authStorage } = await import("./replit_integrations/auth/storage");
        await authStorage.upsertUser({
          id: 'dev-user-1',
          email: 'dev@local.test',
          firstName: 'Dev',
          lastName: 'User',
        });
        req.session.isLoggedIn = true;
        res.redirect('/');
      } catch (error) {
        console.error('Dev login error:', error);
        res.status(500).send('Login failed');
      }
    });

    // Mock logout - clears session and redirects home
    app.get("/api/logout", (req: any, res) => {
      req.session.isLoggedIn = false;
      res.redirect('/');
    });

    // DEV ONLY: Generate test runs to simulate user activity over time
    // Usage: POST /api/dev/generate-runs
    // Body: { days: 14, runsPerWeek: 3, minDistanceKm: 5, maxDistanceKm: 30 }
    app.post("/api/dev/generate-runs", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const {
          days = 14,
          runsPerWeek = 3,
          minDistanceKm = 3,
          maxDistanceKm = 13
        } = req.body;
        const userId = 'dev-user-1';

        // Get active character
        const character = await storage.getActiveCharacter(userId);
        if (!character) {
          return res.status(400).json({ message: "Create a character first" });
        }

        // Import item reward service
        const { processRunRewards } = await import("./services/itemRewards");

        const createdRuns = [];
        const totalRuns = Math.ceil((days / 7) * runsPerWeek);
        const runNames = [
          "Morning Run", "Evening Jog", "Trail Run", "Recovery Run",
          "Tempo Run", "Long Run", "Easy Run", "Hill Repeats",
          "Speed Work", "Base Building", "Fartlek", "Progression Run"
        ];

        // Track which days have had health updates
        const healthUpdateDates = new Set<string>();

        for (let i = 0; i < totalRuns; i++) {
          // Spread runs across the date range
          const daysAgo = Math.floor((i / totalRuns) * days);
          const runDate = new Date();
          runDate.setDate(runDate.getDate() - (days - daysAgo));
          runDate.setHours(Math.floor(Math.random() * 12) + 6); // 6am-6pm

          // Random realistic run data with configurable distance range
          const distanceKm = minDistanceKm + Math.random() * (maxDistanceKm - minDistanceKm);
          const paceMinPerKm = 5 + Math.random() * 3; // 5-8 min/km
          const distanceMeters = Math.round(distanceKm * 1000);

          // Check if this is the first run of the day
          const dateKey = runDate.toISOString().split('T')[0];
          const isFirstRunOfDay = !healthUpdateDates.has(dateKey);
          if (isFirstRunOfDay) {
            healthUpdateDates.add(dateKey);
          }

          const run = await storage.createRun({
            userId,
            characterId: character.id,
            stravaActivityId: `test-run-${Date.now()}-${i}`,
            distance: distanceMeters,
            duration: Math.round(distanceKm * paceMinPerKm * 60), // seconds
            date: runDate,
            processed: true,
            name: runNames[Math.floor(Math.random() * runNames.length)],
            elevationGain: Math.round(Math.random() * 200 + 20), // 20-220m
            healthUpdated: isFirstRunOfDay,
          });

          // Award items for this run (no polyline for dev mode, so weather rewards won't trigger)
          const rewardResult = await processRunRewards(userId, run.id, distanceMeters, null, runDate);

          createdRuns.push({
            ...run,
            itemsAwarded: rewardResult.items.length,
            rarities: rewardResult.rarities,
          });
        }

        // Update character stats
        const totalDistanceAdded = createdRuns.reduce((sum, r) => sum + r.distance, 0);
        await storage.updateCharacter(character.id, {
          totalRuns: (character.totalRuns || 0) + createdRuns.length,
          totalDistance: (character.totalDistance || 0) + totalDistanceAdded,
        });

        res.json({
          message: `Created ${createdRuns.length} test runs over ${days} days with item rewards`,
          runs: createdRuns
        });
      } catch (error) {
        console.error('Generate runs error:', error);
        res.status(500).json({ message: "Failed to generate runs" });
      }
    });

    // DEV ONLY: Clear all test runs and their awarded items
    app.delete("/api/dev/clear-runs", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const { db } = await import("./db");
        const { runs, runItems, inventory, userUnlocks, dailyCheckIns, medalTransactions } = await import("@shared/schema");
        const { like, inArray, eq } = await import("drizzle-orm");
        const userId = 'dev-user-1';

        // First get all test run IDs
        const testRuns = await db.select({ id: runs.id })
          .from(runs)
          .where(like(runs.stravaActivityId, 'test-run-%'));

        const testRunIds = testRuns.map(r => r.id);

        if (testRunIds.length > 0) {
          // Delete run items for these runs
          await db.delete(runItems).where(inArray(runItems.runId, testRunIds));
        }

        // Delete the runs themselves
        await db.delete(runs).where(like(runs.stravaActivityId, 'test-run-%'));

        // Clear inventory items for test user
        await db.delete(inventory).where(eq(inventory.userId, userId));

        // Clear user unlocks (achievements)
        await db.delete(userUnlocks).where(eq(userUnlocks.userId, userId));

        // Clear daily check-ins
        await db.delete(dailyCheckIns).where(eq(dailyCheckIns.userId, userId));

        // Clear medal transactions
        await db.delete(medalTransactions).where(eq(medalTransactions.userId, userId));

        // Reset character stats
        const character = await storage.getActiveCharacter(userId);
        if (character) {
          await storage.updateCharacter(character.id, {
            totalRuns: 0,
            totalDistance: 0,
            daysAlive: 0,
            healthState: 0,
            medalBalance: 0,
          });
        }

        res.json({ message: "Cleared all test data: runs, items, inventory, achievements, check-ins, medals" });
      } catch (error) {
        console.error('Clear runs error:', error);
        res.status(500).json({ message: "Failed to clear runs" });
      }
    });

    // DEV ONLY: Full reset - clear ALL user data to test as fresh user
    app.delete("/api/dev/reset-user", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const { db } = await import("./db");
        const { runs, runItems, inventory, characters, stravaAccounts } = await import("@shared/schema");
        const { eq } = await import("drizzle-orm");
        const userId = 'dev-user-1';

        // Delete run items for this user
        await db.delete(runItems).where(eq(runItems.userId, userId));

        // Delete runs
        await db.delete(runs).where(eq(runs.userId, userId));

        // Delete inventory
        await db.delete(inventory).where(eq(inventory.userId, userId));

        // Delete characters
        await db.delete(characters).where(eq(characters.userId, userId));

        // Delete strava account
        await db.delete(stravaAccounts).where(eq(stravaAccounts.userId, userId));

        res.json({ message: "Full reset complete - user can now test as fresh user" });
      } catch (error) {
        console.error('Reset user error:', error);
        res.status(500).json({ message: "Failed to reset user" });
      }
    });

    // DEV ONLY: Set character state directly for testing specific scenarios
    // Usage: POST /api/dev/set-character-state
    // Body: { totalRuns?: number, healthState?: number, daysAlive?: number, medalBalance?: number }
    app.post("/api/dev/set-character-state", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const userId = 'dev-user-1';
        const { totalRuns, healthState, daysAlive, medalBalance } = req.body;

        const character = await storage.getActiveCharacter(userId);
        if (!character) {
          return res.status(400).json({ message: "Create a character first" });
        }

        // Build update object with only provided fields
        const updates: Partial<typeof character> = {};
        if (totalRuns !== undefined) updates.totalRuns = totalRuns;
        if (healthState !== undefined) updates.healthState = healthState;
        if (daysAlive !== undefined) updates.daysAlive = daysAlive;
        if (medalBalance !== undefined) updates.medalBalance = medalBalance;

        const updated = await storage.updateCharacter(character.id, updates);
        res.json({ success: true, character: updated });
      } catch (error) {
        console.error('Set character state error:', error);
        res.status(500).json({ message: "Failed to set character state" });
      }
    });

    // DEV ONLY: Simulate a single run with specific distance
    // Usage: POST /api/dev/simulate-run
    // Body: { distanceKm: number, triggerRewards?: boolean }
    // Note: Only the first run of each day affects health AND stage progression
    app.post("/api/dev/simulate-run", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const { db } = await import("./db");
        const { runs } = await import("@shared/schema");
        const { eq, and, gte, lt } = await import("drizzle-orm");
        const userId = 'dev-user-1';
        const { distanceKm = 5, triggerRewards = true } = req.body;

        const character = await storage.getActiveCharacter(userId);
        if (!character) {
          return res.status(400).json({ message: "Create a character first" });
        }

        // Don't allow runs if character is dead
        if (character.status === "dead" || character.healthState >= 4) {
          return res.status(400).json({ message: "Character is dead. Create a new one first." });
        }

        const distanceMeters = Math.round(distanceKm * 1000);
        const paceMinPerKm = 5 + Math.random() * 2; // 5-7 min/km

        const runNames = [
          "Dev Test Run", "Quick Test", "Simulated Run", "Test Activity"
        ];

        // Check if today already has a run that counted for health/stage
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const todaysCountedRuns = await db
          .select()
          .from(runs)
          .where(
            and(
              eq(runs.userId, userId),
              eq(runs.healthUpdated, true),
              gte(runs.date, startOfDay),
              lt(runs.date, endOfDay)
            )
          );

        const isFirstRunOfDay = todaysCountedRuns.length === 0;

        const run = await storage.createRun({
          userId,
          characterId: character.id,
          stravaActivityId: `test-run-${Date.now()}`,
          distance: distanceMeters,
          duration: Math.round(distanceKm * paceMinPerKm * 60),
          date: new Date(),
          processed: true,
          name: runNames[Math.floor(Math.random() * runNames.length)],
          elevationGain: Math.round(Math.random() * 100 + 10),
          healthUpdated: isFirstRunOfDay, // Only first run of day counts
        });

        let rewardResult = { items: [] as any[], rarities: [] as string[], medalsAwarded: 0 };
        let progressionReward = null;

        // Only process stage progression if this is the first run of the day
        const previousRuns = character.totalRuns || 0;
        const newTotalRuns = isFirstRunOfDay ? previousRuns + 1 : previousRuns;

        if (triggerRewards && distanceMeters >= 1000) {
          const { processRunRewards } = await import("./services/itemRewards");
          const { checkProgressionReward } = await import("./services/medalService");

          rewardResult = await processRunRewards(userId, run.id, distanceMeters, null, new Date());

          // Check for progression ONLY if first run of day
          if (isFirstRunOfDay) {
            const progression = await checkProgressionReward(userId, previousRuns, newTotalRuns);
            if (progression) {
              progressionReward = {
                stage: progression.transitionKey.split('_to_')[1].replace(/_/g, ' '),
                medalsAwarded: progression.medalsAwarded,
              };
            }
          }
        }

        // Health regeneration: Only the FIRST run of each day improves health
        const currentHealth = character.healthState || 0;
        const newHealthState = isFirstRunOfDay
          ? Math.max(0, currentHealth - 1)
          : currentHealth;
        const healthImproved = isFirstRunOfDay && currentHealth > 0;

        // Update character stats
        // - totalRuns only increments on first run of day
        // - Always add distance
        // - Reset consecutiveRestDays on any run
        // - Health only improves on first run of day
        await storage.updateCharacter(character.id, {
          totalRuns: newTotalRuns,
          totalDistance: (character.totalDistance || 0) + distanceMeters,
          healthState: newHealthState,
          consecutiveRestDays: 0, // Reset rest days on any run
        });

        res.json({
          success: true,
          run,
          awardedItems: rewardResult.items,
          rarities: rewardResult.rarities,
          medalsAwarded: rewardResult.medalsAwarded,
          progressionReward,
          healthImproved,
          newHealthState,
          isFirstRunOfDay,
          stageProgressed: isFirstRunOfDay,
          healthPercent: Math.max(0, 100 - newHealthState * 25),
          newTotalRuns,
        });
      } catch (error) {
        console.error('Simulate run error:', error);
        res.status(500).json({ message: "Failed to simulate run" });
      }
    });

    // DEV ONLY: Award test items of specific rarity
    // Usage: POST /api/dev/award-items
    // Body: { rarity: "common"|"uncommon"|"rare"|"epic"|"legendary", count: number }
    app.post("/api/dev/award-items", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const userId = 'dev-user-1';
        const { rarity = "common", count = 1 } = req.body;

        const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
        if (!validRarities.includes(rarity)) {
          return res.status(400).json({ message: "Invalid rarity. Must be: " + validRarities.join(", ") });
        }

        const { db } = await import("./db");
        const { items, inventory, userUnlocks } = await import("@shared/schema");
        const { eq, and } = await import("drizzle-orm");

        // Get items of the specified rarity
        const matchingItems = await db
          .select()
          .from(items)
          .where(and(
            eq(items.rarity, rarity),
            eq(items.isSpecialReward, false)
          ));

        if (matchingItems.length === 0) {
          return res.status(400).json({ message: `No ${rarity} items found in database` });
        }

        const awardedItems = [];
        for (let i = 0; i < count; i++) {
          const randomItem = matchingItems[Math.floor(Math.random() * matchingItems.length)];

          // Add to inventory
          await db.insert(inventory).values({
            userId,
            itemId: randomItem.id,
            equipped: false,
          });

          // Track unlock (ignore if already unlocked)
          try {
            await db.insert(userUnlocks).values({
              userId,
              itemId: randomItem.id,
            });
          } catch {
            // Already unlocked
          }

          awardedItems.push(randomItem);
        }

        res.json({
          success: true,
          awardedItems,
          message: `Awarded ${count} ${rarity} item(s)`,
        });
      } catch (error) {
        console.error('Award items error:', error);
        res.status(500).json({ message: "Failed to award items" });
      }
    });

    // DEV ONLY: Max everything - maxed stage, full health, high medals
    // Usage: POST /api/dev/max-everything
    app.post("/api/dev/max-everything", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const userId = 'dev-user-1';

        const character = await storage.getActiveCharacter(userId);
        if (!character) {
          return res.status(400).json({ message: "Create a character first" });
        }

        // Max everything: 30+ runs for maxed stage, health 0, high medals
        const updated = await storage.updateCharacter(character.id, {
          totalRuns: 35,
          healthState: 0,
          daysAlive: 100,
          medalBalance: 500,
          totalDistance: 500000, // 500km
        });

        res.json({ success: true, character: updated });
      } catch (error) {
        console.error('Max everything error:', error);
        res.status(500).json({ message: "Failed to max everything" });
      }
    });

    // DEV ONLY: Simulate a day passing for testing check-in streaks
    // Usage: POST /api/dev/simulate-day
    // This shifts all check-in dates back by 1 day, making "today" a new day
    // Health only decays after 2 CONSECUTIVE days without running
    app.post("/api/dev/simulate-day", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const { db } = await import("./db");
        const { dailyCheckIns, runs } = await import("@shared/schema");
        const { eq, sql, and, gte, lt } = await import("drizzle-orm");
        const userId = 'dev-user-1';

        // Shift all check-in dates back by 1 day
        await db.execute(sql`
          UPDATE daily_check_ins
          SET check_in_date = check_in_date - INTERVAL '1 day'
          WHERE user_id = ${userId}
        `);

        // Also shift all run dates back by 1 day so "today" has no runs
        await db.execute(sql`
          UPDATE runs
          SET date = date - INTERVAL '1 day'
          WHERE user_id = ${userId}
        `);

        // Reset health_updated and stage_updated flags for the new "today"
        await db.execute(sql`
          UPDATE runs
          SET health_updated = false
          WHERE user_id = ${userId}
        `);

        const character = await storage.getActiveCharacter(userId);
        if (character && character.status !== "dead") {
          // Increment consecutive rest days (days without running)
          const currentRestDays = (character as any).consecutiveRestDays || 0;
          const newRestDays = currentRestDays + 1;

          // Health only decays after 2 consecutive days without running
          const shouldDecayHealth = newRestDays >= 2;
          const currentHealth = character.healthState || 0;
          const newHealthState = shouldDecayHealth
            ? Math.min(4, currentHealth + 1)
            : currentHealth;
          const isDead = newHealthState >= 4;

          await storage.updateCharacter(character.id, {
            daysAlive: (character.daysAlive || 0) + 1,
            consecutiveRestDays: newRestDays,
            healthState: newHealthState,
            ...(isDead ? { status: "dead", deathDate: new Date() } : {}),
          });

          const healthPercent = Math.max(0, 100 - newHealthState * 25);

          res.json({
            success: true,
            message: isDead
              ? "Your Esko has died from neglect (2+ days without running)."
              : shouldDecayHealth
                ? `Day ${newRestDays} without running. Health decayed to ${healthPercent}%.`
                : `Day ${newRestDays} without running. Health stable (decays after 2 days).`,
            daysAlive: (character.daysAlive || 0) + 1,
            consecutiveRestDays: newRestDays,
            healthState: newHealthState,
            healthPercent,
            healthDecayed: shouldDecayHealth,
            isDead,
          });
        } else {
          res.json({
            success: true,
            message: character?.status === "dead"
              ? "Character is already dead. Create a new one."
              : "No active character found.",
            daysAlive: 0,
          });
        }
      } catch (error) {
        console.error('Simulate day error:', error);
        res.status(500).json({ message: "Failed to simulate day passing" });
      }
    });

    // DEV ONLY: Set character as dead and archive it
    // Usage: POST /api/dev/kill-character
    app.post("/api/dev/kill-character", async (req: any, res) => {
      if (!req.session.isLoggedIn) {
        return res.status(401).json({ message: "Must be logged in" });
      }

      try {
        const userId = 'dev-user-1';

        const character = await storage.getActiveCharacter(userId);
        if (!character) {
          return res.status(400).json({ message: "No active character to kill" });
        }

        // Archive the character
        const updated = await storage.updateCharacter(character.id, {
          status: "dead",
          healthState: 4,
          deathDate: new Date(),
        });

        res.json({
          success: true,
          message: "Character has been archived. You can now create a new one.",
          character: updated,
        });
      } catch (error) {
        console.error('Kill character error:', error);
        res.status(500).json({ message: "Failed to kill character" });
      }
    });

    // Dev auth middleware for protected routes
    app.use((req: any, res, next) => {
      if (req.session.isLoggedIn) {
        req.user = devUser;
        req.isAuthenticated = () => true;
      } else {
        req.isAuthenticated = () => false;
      }
      next();
    });
  } else {
    const { setupAuth, registerAuthRoutes } = await import("./replit_integrations/auth");
    await setupAuth(app);
    registerAuthRoutes(app);
  }

  // Use dev auth or real auth
  const isAuthenticated: RequestHandler = isDevMode ? devAuth : (await import("./replit_integrations/auth")).isAuthenticated;

  // === SEED DATA ===
  // Create some default items if none exist
  const existingItems = await storage.getAllItems();
  if (existingItems.length === 0) {
    // Create seed items
    // Since we don't have db.insert direct access here cleanly, we can use a helper or just skip for now.
    // Or add `createItem` to storage.
    // Let's assume we'll add them later via a script or storage method.
    // Actually, let's add `createItem` to storage to make this clean.
    // For now, I'll skip auto-seeding in routes to keep it simple, or add a dedicated endpoint.
  }

  // === STRAVA ROUTES ===
  app.get(api.strava.connect.path, isAuthenticated, (req, res) => {
    // Redirect to Strava
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = isDevMode
      ? `http://localhost:3001/api/strava/callback`
      : `https://${req.hostname}/api/strava/callback`;
    const scope = "activity:read_all";
    if (!clientId) {
       return res.status(500).send("STRAVA_CLIENT_ID not configured");
    }
    
    const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
    res.redirect(url);
  });

  app.get('/api/strava/callback', isAuthenticated, async (req: any, res) => {
    const code = req.query.code as string;
    if (!code) {
        return res.status(400).send("No code provided");
    }

    try {
        // Exchange code for token
        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
            throw new Error("Strava credentials missing");
        }

        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code'
            })
        });

        if (!response.ok) {
            throw new Error(`Strava auth failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Save to DB (including athlete profile info)
        await storage.upsertStravaAccount({
            userId: req.user.claims.sub,
            athleteId: String(data.athlete.id),
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
            lastFetchAt: new Date(),
            athleteFirstName: data.athlete.firstname || null,
            athleteLastName: data.athlete.lastname || null,
            athleteProfilePicture: data.athlete.profile || null,
        });

        res.redirect('/settings'); // Or dashboard
    } catch (error) {
        console.error("Strava callback error:", error);
        res.status(500).send("Authentication failed");
    }
  });
  
  app.get(api.strava.status.path, isAuthenticated, async (req: any, res) => {
      const account = await storage.getStravaAccount(req.user.claims.sub);
      res.json({
          isConnected: !!account,
          lastSync: account?.lastFetchAt ? account.lastFetchAt.toISOString() : null,
          athleteName: account ? `${account.athleteFirstName || ''} ${account.athleteLastName || ''}`.trim() || null : null,
          athleteProfilePicture: account?.athleteProfilePicture || null,
      });
  });

  // Strava Sync - Fetch activities and create runs
  app.post(api.strava.sync.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;

    try {
      // Get the user's current timezone from the request (sent by browser)
      const userTimezone = req.body?.timezone || 'UTC';

      // Get Strava account
      const account = await storage.getStravaAccount(userId);
      if (!account) {
        return res.status(400).json({ message: "Strava not connected. Please connect your account first." });
      }

      // Get active character to check creation date (represents user's "fresh start")
      const character = await storage.getActiveCharacter(userId);
      if (!character) {
        return res.status(400).json({ message: "No active character. Please create one first." });
      }

      // Helper function to get midnight (start of day) in a specific timezone as a UTC Date
      const getMidnightInTimezone = (date: Date, timezone: string): Date => {
        // Get the calendar date (YYYY-MM-DD) in the target timezone
        const datePart = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);

        // Calculate the timezone offset on this specific date (handles DST)
        // Use noon to avoid DST transition edge cases around midnight
        const noonUTC = new Date(`${datePart}T12:00:00Z`);
        const utcHour = 12; // We know it's noon UTC
        const tzHour = parseInt(new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          hour12: false
        }).format(noonUTC));

        // Offset = UTC - local (positive means local is behind UTC)
        // If noon UTC shows as 6am local, offset is +6 hours
        let offsetHours = utcHour - tzHour;
        if (offsetHours > 12) offsetHours -= 24;
        if (offsetHours < -12) offsetHours += 24;

        // Midnight local = midnight UTC + offset
        // e.g., midnight Central (UTC-6) = 00:00 UTC + 6h = 06:00 UTC
        const midnightUTC = new Date(`${datePart}T00:00:00Z`);
        return new Date(midnightUTC.getTime() + offsetHours * 60 * 60 * 1000);
      }

      // Calculate the start of the creation day using the user's CURRENT timezone
      // This ensures runs count even if the user travels to a different timezone
      const characterCreatedAt = character.createdAt ? new Date(character.createdAt) : new Date(0);
      const startOfCreationDay = getMidnightInTimezone(characterCreatedAt, userTimezone);

      console.log("[Strava Sync] Debug info:");
      console.log("  User timezone:", userTimezone);
      console.log("  Character createdAt (UTC):", characterCreatedAt.toISOString());
      console.log("  Character createdAt (local):", characterCreatedAt.toLocaleString('en-US', { timeZone: userTimezone }));
      console.log("  Start of creation day (UTC):", startOfCreationDay.toISOString());
      console.log("  Start of creation day (local):", startOfCreationDay.toLocaleString('en-US', { timeZone: userTimezone }));

      // Check if token needs refresh
      let accessToken = account.accessToken;
      const now = Math.floor(Date.now() / 1000);

      if (account.expiresAt <= now) {
        // Token expired, refresh it
        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return res.status(500).json({ message: "Strava credentials not configured" });
        }

        const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: account.refreshToken,
            grant_type: 'refresh_token'
          })
        });

        if (!refreshResponse.ok) {
          console.error("Token refresh failed:", await refreshResponse.text());
          return res.status(400).json({ message: "Failed to refresh Strava token. Please reconnect your account." });
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Update tokens in database
        await storage.upsertStravaAccount({
          userId,
          athleteId: account.athleteId,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token,
          expiresAt: refreshData.expires_at,
          lastFetchAt: new Date()
        });
      }

      // Fetch activities from Strava (last 30 days, runs only)
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      const activitiesResponse = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=100`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (!activitiesResponse.ok) {
        console.error("Strava API error:", await activitiesResponse.text());
        return res.status(400).json({ message: "Failed to fetch activities from Strava" });
      }

      const activities = await activitiesResponse.json();

      // Filter for runs only (type === "Run") and only activities on or after the day of character creation
      const runActivities = activities.filter((a: any) => {
        if (a.type !== "Run") return false;
        const activityDate = new Date(a.start_date);
        const included = activityDate >= startOfCreationDay;
        console.log(`  Activity "${a.name}": ${activityDate.toLocaleString('en-US', { timeZone: userTimezone })} - ${included ? 'INCLUDED' : 'EXCLUDED'}`);
        return included;
      });
      console.log(`  Total runs included: ${runActivities.length}`);

      // Get existing run IDs to avoid duplicates
      const existingRuns = await storage.getRuns(userId);
      const existingStravaIds = new Set(existingRuns.map(r => r.stravaActivityId));

      // Helper to get calendar date string in user's timezone (YYYY-MM-DD)
      const getCalendarDate = (date: Date, timezone: string): string => {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      }

      // Track which calendar days already have runs (for daysAlive calculation)
      const existingRunDays = new Set<string>();
      for (const run of existingRuns) {
        const runDate = getCalendarDate(new Date(run.date), userTimezone);
        existingRunDays.add(runDate);
      }

      // Fix: If daysAlive is out of sync with actual run days, recalculate it
      // Age = number of distinct run days - 1 (first day is day 0)
      const actualDaysAlive = Math.max(0, existingRunDays.size - 1);
      if (character.daysAlive !== actualDaysAlive) {
        console.log(`  Fixing daysAlive: was ${character.daysAlive}, should be ${actualDaysAlive} (${existingRunDays.size} distinct run days)`);
        await storage.updateCharacter(character.id, {
          daysAlive: actualDaysAlive,
        });
        // Update local reference for further calculations
        character.daysAlive = actualDaysAlive;
      }

      // Import item reward service and medal service
      const { processRunRewards } = await import("./services/itemRewards");
      const { checkProgressionReward } = await import("./services/medalService");

      // Store previous run count for progression check
      const previousTotalRuns = character.totalRuns || 0;

      // Process new runs
      let syncedCount = 0;
      let totalDistanceAdded = 0;
      let newDaysCount = 0;
      let totalMedalsAwarded = 0;
      const allAwardedItems: any[] = [];
      const newRunDays = new Set<string>();

      for (const activity of runActivities) {
        const stravaId = String(activity.id);

        // Skip if already exists
        if (existingStravaIds.has(stravaId)) {
          continue;
        }

        const activityDate = new Date(activity.start_date);
        const calendarDay = getCalendarDate(activityDate, userTimezone);

        // Check if this is a new calendar day (not in existing runs or already counted in this sync)
        const isNewDay = !existingRunDays.has(calendarDay) && !newRunDays.has(calendarDay);
        console.log(`  New run on ${calendarDay}, isNewDay: ${isNewDay}`);
        if (isNewDay) {
          newDaysCount++;
          newRunDays.add(calendarDay);
          console.log(`  NEW DAY DETECTED! newDaysCount is now: ${newDaysCount}`);
        }

        // Create run record
        const run = await storage.createRun({
          userId,
          characterId: character.id,
          stravaActivityId: stravaId,
          distance: Math.round(activity.distance), // meters
          duration: activity.moving_time, // seconds
          date: activityDate,
          processed: true,
          name: activity.name || "Run",
          polyline: activity.map?.summary_polyline || null,
          elevationGain: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : null,
          healthUpdated: false, // Will be set by health logic later
        });

        // Award items for this run (only if >= 1km)
        if (run.distance >= 1000) {
          const rewardResult = await processRunRewards(userId, run.id, run.distance, run.polyline, run.date);
          if (rewardResult.items.length > 0) {
            allAwardedItems.push(...rewardResult.items);
          }
          totalMedalsAwarded += rewardResult.medalsAwarded;
        }

        syncedCount++;
        totalDistanceAdded += run.distance;
      }

      // Check for progression reward
      let progressionReward = null;
      if (syncedCount > 0) {
        // daysAlive = total distinct run days - 1 (first day is day 0)
        const totalDistinctDays = existingRunDays.size + newDaysCount;
        const newDaysAlive = Math.max(0, totalDistinctDays - 1);
        const newTotalRuns = previousTotalRuns + syncedCount;

        console.log(`  Updating character: syncedCount=${syncedCount}, newDaysCount=${newDaysCount}, totalDistinctDays=${totalDistinctDays}, newDaysAlive=${newDaysAlive}`);
        await storage.updateCharacter(character.id, {
          totalRuns: newTotalRuns,
          totalDistance: (character.totalDistance || 0) + totalDistanceAdded,
          daysAlive: newDaysAlive,
        });

        // Check for character progression reward
        const progression = await checkProgressionReward(userId, previousTotalRuns, newTotalRuns);
        if (progression) {
          progressionReward = {
            stage: progression.transitionKey.split('_to_')[1].replace(/_/g, ' '),
            medalsAwarded: progression.medalsAwarded,
          };
          totalMedalsAwarded += progression.medalsAwarded;
        }
      }

      // Update last fetch time
      await storage.upsertStravaAccount({
        userId,
        athleteId: account.athleteId,
        accessToken,
        refreshToken: account.refreshToken,
        expiresAt: account.expiresAt,
        lastFetchAt: new Date()
      });

      res.json({
        synced: syncedCount,
        message: syncedCount > 0
          ? `Synced ${syncedCount} new run${syncedCount > 1 ? 's' : ''}!`
          : "No new runs to sync.",
        awardedItems: allAwardedItems,
        medalsAwarded: totalMedalsAwarded > 0 ? totalMedalsAwarded : undefined,
        progressionReward: progressionReward || undefined,
      });
    } catch (error) {
      console.error("Strava sync error:", error);
      res.status(500).json({ message: "Failed to sync activities" });
    }
  });

  // === CHARACTER ROUTES ===
  // Returns most recent character (alive or dead) for displaying stats
  app.get(api.character.get.path, isAuthenticated, async (req: any, res) => {
    const character = await storage.getMostRecentCharacter(req.user.claims.sub);
    if (!character) {
      return res.status(404).json({ message: "No character found" });
    }
    res.json(character);
  });

  app.post(api.character.create.path, isAuthenticated, async (req: any, res) => {
    try {
        // Check if active character exists
        const active = await storage.getActiveCharacter(req.user.claims.sub);
        if (active) {
            return res.status(400).json({ message: "Active character already exists" });
        }
        
        const input = api.character.create.input.parse(req.body);
        const character = await storage.createCharacter({
            ...input,
            userId: req.user.claims.sub
        });
        res.status(201).json(character);
    } catch (err) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        throw err;
    }
  });

  app.get(api.character.archive.path, isAuthenticated, async (req: any, res) => {
      const archive = await storage.getCharacterArchive(req.user.claims.sub);
      res.json(archive);
  });

  // === INVENTORY ROUTES ===
  app.get(api.inventory.list.path, isAuthenticated, async (req: any, res) => {
      const inventory = await storage.getInventory(req.user.claims.sub);
      res.json(inventory);
  });
  
  // === RUNS ROUTES ===
  app.get(api.runs.list.path, isAuthenticated, async (req: any, res) => {
    const runs = await storage.getRuns(req.user.claims.sub);
    res.json(runs);
  });

  // === ACTIVITIES ROUTES (Paginated) ===
  app.get(api.activities.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const queryResult = api.activities.list.query.safeParse(req.query);
      if (!queryResult.success) {
        return res.status(400).json({ message: "Invalid query parameters" });
      }

      const { page, limit } = queryResult.data;
      const result = await storage.getActivitiesPaginated(req.user.claims.sub, page, limit);

      res.json({
        activities: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      console.error("Activities fetch error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // === ACHIEVEMENTS ROUTES ===
  app.get(api.achievements.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const achievements = await storage.getAchievements(req.user.claims.sub);
      res.json({
        items: achievements.map(item => ({
          ...item,
          unlockedAt: item.unlockedAt ? item.unlockedAt.toISOString() : null,
        })),
      });
    } catch (error) {
      console.error("Achievements fetch error:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // === MEDALS ROUTES ===
  const {
    getMedalBalance,
    getCheckInStatus,
    performCheckIn,
    getMedalHistory,
    spendMedals,
  } = await import("./services/medalService");

  // Get medal status (balance + check-in status)
  app.get(api.medals.status.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timezone = (req.query.timezone as string) || 'UTC';

      const balance = await getMedalBalance(userId);
      const status = await getCheckInStatus(userId, timezone);

      // Ensure all values match the expected schema types
      const response = {
        balance: Number(balance),
        canCheckIn: Boolean(status.canCheckIn),
        currentStreak: Number(status.currentStreak),
        daysUntilBonus: Number(status.daysUntilBonus),
        lastCheckIn: status.lastCheckIn ? String(status.lastCheckIn) : null,
      };
      console.log("Medal status response:", JSON.stringify(response));
      res.json(response);
    } catch (error) {
      console.error("Medal status error:", error);
      res.status(500).json({ message: "Failed to fetch medal status" });
    }
  });

  // Perform daily check-in
  app.post(api.medals.checkIn.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timezone = req.body?.timezone || 'UTC';

      const result = await performCheckIn(userId, timezone);
      const newBalance = await getMedalBalance(userId);

      res.json({
        medalsAwarded: result.medalsAwarded,
        currentStreak: result.currentStreak,
        isStreakBonus: result.isStreakBonus,
        newBalance,
      });
    } catch (error: any) {
      console.error("Check-in error:", error);
      if (error.message === "Already checked in today") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // Get medal transaction history
  app.get(api.medals.history.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const queryResult = api.medals.history.query.safeParse(req.query);
      const limit = queryResult.success ? queryResult.data.limit : 50;

      const transactions = await getMedalHistory(userId, limit);

      res.json({
        transactions: transactions.map(t => ({
          id: t.id,
          amount: t.amount,
          source: t.source,
          description: t.description,
          createdAt: t.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error("Medal history error:", error);
      res.status(500).json({ message: "Failed to fetch medal history" });
    }
  });

  // === SHOP ROUTES ===
  app.post(api.shop.purchase.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId } = api.shop.purchase.input.parse(req.body);

      // Get the item
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(400).json({ message: "Item not found" });
      }

      // Check if item is purchasable
      if (!item.price || item.price <= 0) {
        return res.status(400).json({ message: "This item is not for sale" });
      }

      // Check balance
      const balance = await getMedalBalance(userId);
      if (balance < item.price) {
        return res.status(400).json({ message: "Insufficient medals" });
      }

      // Spend medals
      await spendMedals(
        userId,
        item.price,
        itemId,
        `Purchased ${item.name}`
      );

      // Add to inventory
      await storage.addItemToInventory(userId, itemId);

      // Track unlock for achievements
      const { db } = await import("./db");
      const { userUnlocks } = await import("@shared/schema");
      try {
        await db.insert(userUnlocks).values({ userId, itemId });
      } catch {
        // Already unlocked
      }

      const newBalance = await getMedalBalance(userId);

      res.json({
        success: true,
        item: {
          id: item.id,
          name: item.name,
          rarity: item.rarity,
          imageUrl: item.imageUrl,
        },
        newBalance,
      });
    } catch (error: any) {
      console.error("Purchase error:", error);
      if (error.message === "Insufficient medal balance") {
        return res.status(400).json({ message: "Insufficient medals" });
      }
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });

  return httpServer;
}
