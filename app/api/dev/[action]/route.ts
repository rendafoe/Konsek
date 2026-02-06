import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { db } from "@/lib/db";
import {
  runs, runItems, inventory, characters, stravaAccounts, items,
  userUnlocks, dailyCheckIns, medalTransactions,
} from "@/shared/schema";
import { eq, like, inArray, and, gte, lt, sql } from "drizzle-orm";
import { processRunRewards } from "@/lib/services/itemRewards";
import { checkProgressionReward } from "@/lib/services/medalService";

// All dev endpoints are gated behind NODE_ENV check
function devOnly() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ message: "Dev only" }, { status: 403 });
  }
  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const gate = devOnly();
  if (gate) return gate;

  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const { action } = await params;
  const body = await req.json().catch(() => ({}));

  switch (action) {
    case "generate-runs":
      return handleGenerateRuns(userId, body);
    case "set-character-state":
      return handleSetCharacterState(userId, body);
    case "simulate-run":
      return handleSimulateRun(userId, body);
    case "award-items":
      return handleAwardItems(userId, body);
    case "max-everything":
      return handleMaxEverything(userId);
    case "simulate-day":
      return handleSimulateDay(userId);
    case "kill-character":
      return handleKillCharacter(userId);
    default:
      return NextResponse.json({ message: "Unknown dev action" }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const gate = devOnly();
  if (gate) return gate;

  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const { action } = await params;

  switch (action) {
    case "clear-runs":
      return handleClearRuns(userId);
    case "reset-user":
      return handleResetUser(userId);
    default:
      return NextResponse.json({ message: "Unknown dev action" }, { status: 404 });
  }
}

async function handleGenerateRuns(userId: string, body: any) {
  try {
    const { days = 14, runsPerWeek = 3, minDistanceKm = 3, maxDistanceKm = 13 } = body;

    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json({ message: "Create a character first" }, { status: 400 });
    }

    const createdRuns = [];
    const totalRuns = Math.ceil((days / 7) * runsPerWeek);
    const runNames = [
      "Morning Run", "Evening Jog", "Trail Run", "Recovery Run",
      "Tempo Run", "Long Run", "Easy Run", "Hill Repeats",
      "Speed Work", "Base Building", "Fartlek", "Progression Run",
    ];

    const healthUpdateDates = new Set<string>();

    for (let i = 0; i < totalRuns; i++) {
      const daysAgo = Math.floor((i / totalRuns) * days);
      const runDate = new Date();
      runDate.setDate(runDate.getDate() - (days - daysAgo));
      runDate.setHours(Math.floor(Math.random() * 12) + 6);

      const distanceKm = minDistanceKm + Math.random() * (maxDistanceKm - minDistanceKm);
      const paceMinPerKm = 5 + Math.random() * 3;
      const distanceMeters = Math.round(distanceKm * 1000);

      const dateKey = runDate.toISOString().split("T")[0];
      const isFirstRunOfDay = !healthUpdateDates.has(dateKey);
      if (isFirstRunOfDay) healthUpdateDates.add(dateKey);

      const run = await storage.createRun({
        userId,
        characterId: character.id,
        stravaActivityId: `test-run-${Date.now()}-${i}`,
        distance: distanceMeters,
        duration: Math.round(distanceKm * paceMinPerKm * 60),
        date: runDate,
        processed: true,
        name: runNames[Math.floor(Math.random() * runNames.length)],
        elevationGain: Math.round(Math.random() * 200 + 20),
        healthUpdated: isFirstRunOfDay,
      });

      const rewardResult = await processRunRewards(userId, run.id, distanceMeters, null, runDate);

      createdRuns.push({
        ...run,
        itemsAwarded: rewardResult.items.length,
        rarities: rewardResult.rarities,
      });
    }

    const totalDistanceAdded = createdRuns.reduce((sum, r) => sum + r.distance, 0);
    await storage.updateCharacter(character.id, {
      totalRuns: (character.totalRuns || 0) + createdRuns.length,
      totalDistance: (character.totalDistance || 0) + totalDistanceAdded,
    });

    return NextResponse.json({
      message: `Created ${createdRuns.length} test runs over ${days} days with item rewards`,
      runs: createdRuns,
    });
  } catch (error) {
    console.error("Generate runs error:", error);
    return NextResponse.json({ message: "Failed to generate runs" }, { status: 500 });
  }
}

async function handleClearRuns(userId: string) {
  try {
    const testRuns = await db.select({ id: runs.id }).from(runs).where(like(runs.stravaActivityId, "test-run-%"));
    const testRunIds = testRuns.map((r) => r.id);

    if (testRunIds.length > 0) {
      await db.delete(runItems).where(inArray(runItems.runId, testRunIds));
    }

    await db.delete(runs).where(like(runs.stravaActivityId, "test-run-%"));
    await db.delete(inventory).where(eq(inventory.userId, userId));
    await db.delete(userUnlocks).where(eq(userUnlocks.userId, userId));
    await db.delete(dailyCheckIns).where(eq(dailyCheckIns.userId, userId));
    await db.delete(medalTransactions).where(eq(medalTransactions.userId, userId));

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

    return NextResponse.json({ message: "Cleared all test data" });
  } catch (error) {
    console.error("Clear runs error:", error);
    return NextResponse.json({ message: "Failed to clear runs" }, { status: 500 });
  }
}

async function handleResetUser(userId: string) {
  try {
    await db.delete(runItems).where(eq(runItems.userId, userId));
    await db.delete(runs).where(eq(runs.userId, userId));
    await db.delete(inventory).where(eq(inventory.userId, userId));
    await db.delete(characters).where(eq(characters.userId, userId));
    await db.delete(stravaAccounts).where(eq(stravaAccounts.userId, userId));

    return NextResponse.json({ message: "Full reset complete" });
  } catch (error) {
    console.error("Reset user error:", error);
    return NextResponse.json({ message: "Failed to reset user" }, { status: 500 });
  }
}

async function handleSetCharacterState(userId: string, body: any) {
  try {
    const { totalRuns, healthState, daysAlive, medalBalance } = body;

    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json({ message: "Create a character first" }, { status: 400 });
    }

    const updates: Partial<typeof character> = {};
    if (totalRuns !== undefined) updates.totalRuns = totalRuns;
    if (healthState !== undefined) updates.healthState = healthState;
    if (daysAlive !== undefined) updates.daysAlive = daysAlive;
    if (medalBalance !== undefined) updates.medalBalance = medalBalance;

    const updated = await storage.updateCharacter(character.id, updates);
    return NextResponse.json({ success: true, character: updated });
  } catch (error) {
    console.error("Set character state error:", error);
    return NextResponse.json({ message: "Failed to set character state" }, { status: 500 });
  }
}

async function handleSimulateRun(userId: string, body: any) {
  try {
    const { distanceKm = 5, triggerRewards = true } = body;

    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json({ message: "Create a character first" }, { status: 400 });
    }

    if (character.status === "dead" || character.healthState >= 4) {
      return NextResponse.json({ message: "Character is dead. Create a new one first." }, { status: 400 });
    }

    const distanceMeters = Math.round(distanceKm * 1000);
    const paceMinPerKm = 5 + Math.random() * 2;
    const runNames = ["Dev Test Run", "Quick Test", "Simulated Run", "Test Activity"];

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todaysCountedRuns = await db
      .select()
      .from(runs)
      .where(and(eq(runs.userId, userId), eq(runs.healthUpdated, true), gte(runs.date, startOfDay), lt(runs.date, endOfDay)));

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
      healthUpdated: isFirstRunOfDay,
    });

    let rewardResult = { items: [] as any[], rarities: [] as string[], medalsAwarded: 0 };
    let progressionReward = null;

    const previousRuns = character.totalRuns || 0;
    const newTotalRuns = isFirstRunOfDay ? previousRuns + 1 : previousRuns;

    if (triggerRewards && distanceMeters >= 1000) {
      rewardResult = await processRunRewards(userId, run.id, distanceMeters, null, new Date());

      if (isFirstRunOfDay) {
        const progression = await checkProgressionReward(userId, previousRuns, newTotalRuns);
        if (progression) {
          progressionReward = {
            stage: progression.transitionKey.split("_to_")[1].replace(/_/g, " "),
            medalsAwarded: progression.medalsAwarded,
          };
        }
      }
    }

    const currentHealth = character.healthState || 0;
    const newHealthState = isFirstRunOfDay ? Math.max(0, currentHealth - 1) : currentHealth;

    await storage.updateCharacter(character.id, {
      totalRuns: newTotalRuns,
      totalDistance: (character.totalDistance || 0) + distanceMeters,
      healthState: newHealthState,
      consecutiveRestDays: 0,
    });

    return NextResponse.json({
      success: true,
      run,
      awardedItems: rewardResult.items,
      rarities: rewardResult.rarities,
      medalsAwarded: rewardResult.medalsAwarded,
      progressionReward,
      healthImproved: isFirstRunOfDay && currentHealth > 0,
      newHealthState,
      isFirstRunOfDay,
      stageProgressed: isFirstRunOfDay,
      healthPercent: Math.max(0, 100 - newHealthState * 25),
      newTotalRuns,
    });
  } catch (error) {
    console.error("Simulate run error:", error);
    return NextResponse.json({ message: "Failed to simulate run" }, { status: 500 });
  }
}

async function handleAwardItems(userId: string, body: any) {
  try {
    const { rarity = "common", count = 1 } = body;
    const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];
    if (!validRarities.includes(rarity)) {
      return NextResponse.json({ message: "Invalid rarity. Must be: " + validRarities.join(", ") }, { status: 400 });
    }

    const matchingItems = await db
      .select()
      .from(items)
      .where(and(eq(items.rarity, rarity), eq(items.isSpecialReward, false)));

    if (matchingItems.length === 0) {
      return NextResponse.json({ message: `No ${rarity} items found in database` }, { status: 400 });
    }

    const awardedItems = [];
    for (let i = 0; i < count; i++) {
      const randomItem = matchingItems[Math.floor(Math.random() * matchingItems.length)];

      await db.insert(inventory).values({ userId, itemId: randomItem.id, equipped: false });
      try {
        await db.insert(userUnlocks).values({ userId, itemId: randomItem.id });
      } catch {
        // Already unlocked
      }

      awardedItems.push(randomItem);
    }

    return NextResponse.json({ success: true, awardedItems, message: `Awarded ${count} ${rarity} item(s)` });
  } catch (error) {
    console.error("Award items error:", error);
    return NextResponse.json({ message: "Failed to award items" }, { status: 500 });
  }
}

async function handleMaxEverything(userId: string) {
  try {
    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json({ message: "Create a character first" }, { status: 400 });
    }

    const updated = await storage.updateCharacter(character.id, {
      totalRuns: 35,
      healthState: 0,
      daysAlive: 100,
      medalBalance: 500,
      totalDistance: 500000,
    });

    return NextResponse.json({ success: true, character: updated });
  } catch (error) {
    console.error("Max everything error:", error);
    return NextResponse.json({ message: "Failed to max everything" }, { status: 500 });
  }
}

async function handleSimulateDay(userId: string) {
  try {
    await db.execute(sql`UPDATE daily_check_ins SET check_in_date = check_in_date - INTERVAL '1 day' WHERE user_id = ${userId}`);
    await db.execute(sql`UPDATE runs SET date = date - INTERVAL '1 day' WHERE user_id = ${userId}`);
    await db.execute(sql`UPDATE runs SET health_updated = false WHERE user_id = ${userId}`);

    const character = await storage.getActiveCharacter(userId);
    if (character && character.status !== "dead") {
      const currentRestDays = character.consecutiveRestDays || 0;
      const newRestDays = currentRestDays + 1;
      const shouldDecayHealth = newRestDays >= 2;
      const currentHealth = character.healthState || 0;
      const newHealthState = shouldDecayHealth ? Math.min(4, currentHealth + 1) : currentHealth;
      const isDead = newHealthState >= 4;

      await storage.updateCharacter(character.id, {
        daysAlive: (character.daysAlive || 0) + 1,
        consecutiveRestDays: newRestDays,
        healthState: newHealthState,
        ...(isDead ? { status: "dead" as const, deathDate: new Date() } : {}),
      });

      const healthPercent = Math.max(0, 100 - newHealthState * 25);

      return NextResponse.json({
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
      return NextResponse.json({
        success: true,
        message: character?.status === "dead" ? "Character is already dead." : "No active character found.",
        daysAlive: 0,
      });
    }
  } catch (error) {
    console.error("Simulate day error:", error);
    return NextResponse.json({ message: "Failed to simulate day passing" }, { status: 500 });
  }
}

async function handleKillCharacter(userId: string) {
  try {
    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json({ message: "No active character to kill" }, { status: 400 });
    }

    const updated = await storage.updateCharacter(character.id, {
      status: "dead",
      healthState: 4,
      deathDate: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Character has been archived. You can now create a new one.",
      character: updated,
    });
  } catch (error) {
    console.error("Kill character error:", error);
    return NextResponse.json({ message: "Failed to kill character" }, { status: 500 });
  }
}
