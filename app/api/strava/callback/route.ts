import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { storage } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return new NextResponse("No code provided", { status: 400 });
  }

  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Strava credentials missing");
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error(`Strava auth failed: ${response.statusText}`);
    }

    const data = await response.json();

    await storage.upsertStravaAccount({
      userId,
      athleteId: String(data.athlete.id),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      lastFetchAt: new Date(),
      athleteFirstName: data.athlete.firstname || null,
      athleteLastName: data.athlete.lastname || null,
      athleteProfilePicture: data.athlete.profile || null,
    });

    return NextResponse.redirect(new URL("/settings", req.url));
  } catch (error) {
    console.error("Strava callback error:", error);
    return new NextResponse("Authentication failed", { status: 500 });
  }
}
