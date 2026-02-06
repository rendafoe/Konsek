import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";
import { processRunRewards } from "@/lib/services/itemRewards";
import { checkProgressionReward } from "@/lib/services/medalService";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const userTimezone = body?.timezone || "UTC";

    const account = await storage.getStravaAccount(userId);
    if (!account) {
      return NextResponse.json(
        { message: "Strava not connected. Please connect your account first." },
        { status: 400 }
      );
    }

    const character = await storage.getActiveCharacter(userId);
    if (!character) {
      return NextResponse.json(
        { message: "No active character. Please create one first." },
        { status: 400 }
      );
    }

    const getMidnightInTimezone = (date: Date, timezone: string): Date => {
      const datePart = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);

      const noonUTC = new Date(`${datePart}T12:00:00Z`);
      const utcHour = 12;
      const tzHour = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          hour12: false,
        }).format(noonUTC)
      );

      let offsetHours = utcHour - tzHour;
      if (offsetHours > 12) offsetHours -= 24;
      if (offsetHours < -12) offsetHours += 24;

      const midnightUTC = new Date(`${datePart}T00:00:00Z`);
      return new Date(midnightUTC.getTime() + offsetHours * 60 * 60 * 1000);
    };

    const characterCreatedAt = character.createdAt
      ? new Date(character.createdAt)
      : new Date(0);
    const startOfCreationDay = getMidnightInTimezone(characterCreatedAt, userTimezone);

    // Check if token needs refresh
    let accessToken = account.accessToken;
    const now = Math.floor(Date.now() / 1000);

    if (account.expiresAt <= now) {
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { message: "Strava credentials not configured" },
          { status: 500 }
        );
      }

      const refreshResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: account.refreshToken,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshResponse.ok) {
        console.error("Token refresh failed:", await refreshResponse.text());
        return NextResponse.json(
          { message: "Failed to refresh Strava token. Please reconnect your account." },
          { status: 400 }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      await storage.upsertStravaAccount({
        userId,
        athleteId: account.athleteId,
        accessToken: refreshData.access_token,
        refreshToken: refreshData.refresh_token,
        expiresAt: refreshData.expires_at,
        lastFetchAt: new Date(),
      });
    }

    // Fetch activities from Strava (last 30 days, runs only)
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${thirtyDaysAgo}&per_page=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!activitiesResponse.ok) {
      console.error("Strava API error:", await activitiesResponse.text());
      return NextResponse.json(
        { message: "Failed to fetch activities from Strava" },
        { status: 400 }
      );
    }

    const activities = await activitiesResponse.json();

    const runActivities = activities.filter((a: any) => {
      if (a.type !== "Run") return false;
      const activityDate = new Date(a.start_date);
      return activityDate >= startOfCreationDay;
    });

    const existingRuns = await storage.getRuns(userId);
    const existingStravaIds = new Set(existingRuns.map((r) => r.stravaActivityId));

    const getCalendarDate = (date: Date, timezone: string): string => {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    };

    const existingRunDays = new Set<string>();
    for (const run of existingRuns) {
      const runDate = getCalendarDate(new Date(run.date), userTimezone);
      existingRunDays.add(runDate);
    }

    // Fix daysAlive if out of sync
    const actualDaysAlive = Math.max(0, existingRunDays.size - 1);
    if (character.daysAlive !== actualDaysAlive) {
      await storage.updateCharacter(character.id, { daysAlive: actualDaysAlive });
      character.daysAlive = actualDaysAlive;
    }

    const previousTotalRuns = character.totalRuns || 0;

    let syncedCount = 0;
    let totalDistanceAdded = 0;
    let newDaysCount = 0;
    let totalMedalsAwarded = 0;
    const allAwardedItems: any[] = [];
    const newRunDays = new Set<string>();

    for (const activity of runActivities) {
      const stravaId = String(activity.id);
      if (existingStravaIds.has(stravaId)) continue;

      const activityDate = new Date(activity.start_date);
      const calendarDay = getCalendarDate(activityDate, userTimezone);

      const isNewDay = !existingRunDays.has(calendarDay) && !newRunDays.has(calendarDay);
      if (isNewDay) {
        newDaysCount++;
        newRunDays.add(calendarDay);
      }

      const run = await storage.createRun({
        userId,
        characterId: character.id,
        stravaActivityId: stravaId,
        distance: Math.round(activity.distance),
        duration: activity.moving_time,
        date: activityDate,
        processed: true,
        name: activity.name || "Run",
        polyline: activity.map?.summary_polyline || null,
        elevationGain: activity.total_elevation_gain
          ? Math.round(activity.total_elevation_gain)
          : null,
        healthUpdated: false,
      });

      if (run.distance >= 1000) {
        const rewardResult = await processRunRewards(
          userId,
          run.id,
          run.distance,
          run.polyline,
          run.date
        );
        if (rewardResult.items.length > 0) {
          allAwardedItems.push(...rewardResult.items);
        }
        totalMedalsAwarded += rewardResult.medalsAwarded;
      }

      syncedCount++;
      totalDistanceAdded += run.distance;
    }

    let progressionReward = null;
    if (syncedCount > 0) {
      const totalDistinctDays = existingRunDays.size + newDaysCount;
      const newDaysAlive = Math.max(0, totalDistinctDays - 1);
      const newTotalRuns = previousTotalRuns + syncedCount;

      await storage.updateCharacter(character.id, {
        totalRuns: newTotalRuns,
        totalDistance: (character.totalDistance || 0) + totalDistanceAdded,
        daysAlive: newDaysAlive,
      });

      const progression = await checkProgressionReward(userId, previousTotalRuns, newTotalRuns);
      if (progression) {
        progressionReward = {
          stage: progression.transitionKey.split("_to_")[1].replace(/_/g, " "),
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
      lastFetchAt: new Date(),
    });

    return NextResponse.json({
      synced: syncedCount,
      message:
        syncedCount > 0
          ? `Synced ${syncedCount} new run${syncedCount > 1 ? "s" : ""}!`
          : "No new runs to sync.",
      awardedItems: allAwardedItems,
      medalsAwarded: totalMedalsAwarded > 0 ? totalMedalsAwarded : undefined,
      progressionReward: progressionReward || undefined,
    });
  } catch (error) {
    console.error("Strava sync error:", error);
    return NextResponse.json({ message: "Failed to sync activities" }, { status: 500 });
  }
}
