import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ message: "STRAVA_CLIENT_ID not configured" }, { status: 500 });
  }

  const isDevMode = process.env.NODE_ENV === "development";
  const redirectUri = isDevMode
    ? `http://localhost:3000/api/strava/callback`
    : `https://${req.headers.get("host")}/api/strava/callback`;
  const scope = "activity:read_all";

  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  return NextResponse.redirect(url);
}
