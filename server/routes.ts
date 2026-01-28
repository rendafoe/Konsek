import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

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
    const redirectUri = `https://${req.hostname}/api/strava/callback`;
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
        
        // Save to DB
        await storage.upsertStravaAccount({
            userId: req.user.claims.sub,
            athleteId: String(data.athlete.id),
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_at,
            lastFetchAt: new Date()
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
          lastSync: account?.lastFetchAt ? account.lastFetchAt.toISOString() : null
      });
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

  return httpServer;
}
