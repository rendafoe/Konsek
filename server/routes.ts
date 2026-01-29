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

          // Award items for this run
          const rewardResult = await processRunRewards(userId, run.id, distanceMeters);

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
        const { runs, runItems, inventory } = await import("@shared/schema");
        const { like, inArray, eq } = await import("drizzle-orm");

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

        // Also clear inventory items for test user
        await db.delete(inventory).where(eq(inventory.userId, 'dev-user-1'));

        // Reset character stats
        const character = await storage.getActiveCharacter('dev-user-1');
        if (character) {
          await storage.updateCharacter(character.id, {
            totalRuns: 0,
            totalDistance: 0,
          });
        }

        res.json({ message: "Cleared all test runs, run items, inventory, and reset character stats" });
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
      // Get Strava account
      const account = await storage.getStravaAccount(userId);
      if (!account) {
        return res.status(400).json({ message: "Strava not connected. Please connect your account first." });
      }

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

      // Filter for runs only (type === "Run")
      const runActivities = activities.filter((a: any) => a.type === "Run");

      // Get existing run IDs to avoid duplicates
      const existingRuns = await storage.getRuns(userId);
      const existingStravaIds = new Set(existingRuns.map(r => r.stravaActivityId));

      // Get active character
      const character = await storage.getActiveCharacter(userId);
      if (!character) {
        return res.status(400).json({ message: "No active character. Please create one first." });
      }

      // Import item reward service
      const { processRunRewards } = await import("./services/itemRewards");

      // Process new runs
      let syncedCount = 0;
      let totalDistanceAdded = 0;

      for (const activity of runActivities) {
        const stravaId = String(activity.id);

        // Skip if already exists
        if (existingStravaIds.has(stravaId)) {
          continue;
        }

        // Create run record
        const run = await storage.createRun({
          userId,
          characterId: character.id,
          stravaActivityId: stravaId,
          distance: Math.round(activity.distance), // meters
          duration: activity.moving_time, // seconds
          date: new Date(activity.start_date),
          processed: true,
          name: activity.name || "Run",
          polyline: activity.map?.summary_polyline || null,
          elevationGain: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : null,
          healthUpdated: false, // Will be set by health logic later
        });

        // Award items for this run (only if >= 1km)
        if (run.distance >= 1000) {
          await processRunRewards(userId, run.id, run.distance);
        }

        syncedCount++;
        totalDistanceAdded += run.distance;
      }

      // Update character stats if new runs were synced
      if (syncedCount > 0) {
        await storage.updateCharacter(character.id, {
          totalRuns: (character.totalRuns || 0) + syncedCount,
          totalDistance: (character.totalDistance || 0) + totalDistanceAdded,
        });
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
          : "No new runs to sync."
      });
    } catch (error) {
      console.error("Strava sync error:", error);
      res.status(500).json({ message: "Failed to sync activities" });
    }
  });

  // === CHARACTER ROUTES ===
  app.get(api.character.get.path, isAuthenticated, async (req: any, res) => {
    const character = await storage.getActiveCharacter(req.user.claims.sub);
    if (!character) {
      return res.status(404).json({ message: "No active character" });
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

  return httpServer;
}
